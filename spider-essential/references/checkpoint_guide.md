# GCS Checkpoint Management Guide

## Checkpoint Strategy

### Directory Structure (SSOT: 2026-01-08)

```bash
# 현행 운영 버킷 (midyear-spot-480605-n5)
gs://spider-griffin-knou/
├── data-mix-v0/
│   ├── datamix-v0-stage1/
│   │   └── stage1-seed42-v1/
│   │       ├── ckpt_211500.npz   # ← Stage1 Best (Code PPL: 23.46)
│   │       ├── ckpt_214000.npz   # ← Stage1 Final (비교/재현 전용)
│   │       ├── best_ckpt.json
│   │       └── ppl_history.json
│   └── datamix-v0-stage2/
│       └── stage2-seed42-v1/
│           ├── ckpt_284500.npz   # ← Stage2 Best (Code PPL: 20.60)
│           ├── ckpt_305000.npz   # ← Stage2 Final (비교/재현 전용)
│           ├── best_ckpt.json
│           └── ppl_history.json
└── stage1-eval/                  # 평가 결과
└── stage2-eval/                  # 평가 결과
```

> **운영 정책**: Best PPL 체크포인트 우선 사용 (final은 비교/재현 전용)

### Naming Convention

```
ckpt_{step}/
├── checkpoint             # Orbax metadata
├── _CHECKPOINT_METADATA   # Additional metadata
└── *.msgpack             # Actual data
```

---

## Orbax Checkpoint Setup

### Installation

```bash
pip install orbax-checkpoint
pip install "fsspec==2025.12.0" "gcsfs==2025.12.0"  # Version pinning critical!
```

### Basic Setup

```python
import orbax.checkpoint as ocp
from flax.training import orbax_utils

# Create checkpoint manager
options = ocp.CheckpointManagerOptions(
    max_to_keep=5,
    save_interval_steps=100,
)

mgr = ocp.CheckpointManager(
    'gs://bucket/path/',
    ocp.PyTreeCheckpointer(),
    options=options,
)
```

### Save Checkpoint

```python
# Synchronous save (simple but slow)
mgr.save(step, train_state)

# Asynchronous save (fast but need to wait)
mgr.save(step, train_state, args=ocp.args.StandardSave(train_state))
mgr.wait_until_finished()  # CRITICAL: Must wait before next save!
```

### Restore Checkpoint

```python
# Get latest step
latest = mgr.latest_step()

if latest is not None:
    # Create abstract pytree for restoration
    abstract_state = jax.tree.map(
        ocp.utils.to_shape_dtype_struct,
        train_state,
    )

    # Restore
    train_state = mgr.restore(
        latest,
        args=ocp.args.StandardRestore(abstract_state),
    )
    print(f"Restored from step {latest}")
```

---

## FSDP-Aware Checkpointing

### Problem: Sharded State

FSDP shards parameters across devices. Checkpoint must handle this.

### Solution: AsyncCheckpointer with Sharding

```python
from orbax.checkpoint import AsyncCheckpointer
from orbax.checkpoint.type_handlers import PyTreeCheckpointHandler

# Create sharding-aware handler
handler = PyTreeCheckpointHandler()

checkpointer = AsyncCheckpointer(handler)

# Save with sharding info
checkpointer.save(
    step,
    train_state,
    save_args=ocp.args.StandardSave(
        train_state,
        save_args={'aggregate': False}  # Keep sharding
    ),
)
```

### Restore to Different Mesh

```python
# When restoring to different device count
def restore_with_resharding(ckpt_path, target_mesh):
    mgr = ocp.CheckpointManager(ckpt_path, ocp.PyTreeCheckpointer())

    # Create abstract state with target sharding
    abstract_state = create_abstract_state(target_mesh)

    # Orbax handles resharding automatically
    state = mgr.restore(
        mgr.latest_step(),
        args=ocp.args.StandardRestore(abstract_state),
    )
    return state
```

---

## GCS Operations

### Authentication

```bash
# Option 1: Default credentials (on GCP)
# Automatic when running on GCP VMs

# Option 2: Service account key
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json

# Option 3: gcloud auth (local development)
gcloud auth application-default login
```

### gsutil Commands

```bash
# List checkpoints
gsutil ls gs://bucket/byte-griffin-moe/256m/gates/

# Check latest checkpoint
gsutil ls gs://bucket/path/ | sort -V | tail -1

# Download checkpoint
gsutil -m cp -r gs://bucket/path/ckpt_51500 ./local_ckpt/

# Upload checkpoint
gsutil -m cp -r ./local_ckpt gs://bucket/path/

# Delete old checkpoints
gsutil rm -r gs://bucket/path/ckpt_old/
```

### Python gcsfs Access

```python
import gcsfs

fs = gcsfs.GCSFileSystem()

# List files
files = fs.ls('bucket/path/')

# Check exists
exists = fs.exists('bucket/path/ckpt_51500')

# Read file
with fs.open('bucket/path/config.json', 'r') as f:
    config = json.load(f)
```

---

## Common Issues & Solutions

### Issue 1: gcsfs Version Mismatch

**Symptom:**
```
TypeError: __init__() got an unexpected keyword argument 'version_aware'
```

**Solution:**
```bash
pip install "fsspec==2025.12.0" "gcsfs==2025.12.0"
```

### Issue 2: Async Save Not Complete

**Symptom:**
```
FileNotFoundError: Checkpoint not found at step X
```

**Solution:**
```python
# Always wait after async save
mgr.save(step, state)
mgr.wait_until_finished()  # Add this!
```

### Issue 3: Sharding Mismatch on Restore

**Symptom:**
```
ValueError: Shape mismatch during restore
```

**Solution:**
```python
# Create abstract state with correct shapes
abstract_state = jax.tree.map(
    lambda x: jax.ShapeDtypeStruct(x.shape, x.dtype),
    current_state,
)
```

### Issue 4: Permission Denied

**Symptom:**
```
google.api_core.exceptions.Forbidden: 403
```

**Solution:**
```bash
# Check bucket permissions
gsutil iam get gs://bucket/

# Grant access
gsutil iam ch user:email@example.com:objectAdmin gs://bucket/
```

### Issue 5: Timeout on Large Checkpoints

**Symptom:**
```
TimeoutError: Deadline exceeded
```

**Solution:**
```python
# Increase timeout
mgr = ocp.CheckpointManager(
    path,
    ocp.PyTreeCheckpointer(),
    options=ocp.CheckpointManagerOptions(
        save_interval_steps=100,
        max_to_keep=3,
        # Add timeout
        timeout_secs=3600,  # 1 hour
    ),
)
```

---

## Resume Training Pattern

```python
def setup_training(config):
    # Initialize model and optimizer
    model = create_model(config)
    tx = optax.adamw(config.learning_rate)

    # Create initial state
    initial_state = create_train_state(model, tx)

    # Setup checkpoint manager
    mgr = ocp.CheckpointManager(
        config.checkpoint_dir,
        ocp.PyTreeCheckpointer(),
    )

    # Try to restore
    latest = mgr.latest_step()
    if latest is not None and config.resume:
        print(f"Resuming from step {latest}")
        train_state = mgr.restore(latest)
        start_step = latest
    else:
        print("Starting fresh training")
        train_state = initial_state
        start_step = 0

    return train_state, mgr, start_step


def train_loop(train_state, mgr, start_step, config):
    for step in range(start_step, config.total_steps):
        # Training step
        train_state, metrics = train_step(train_state, batch)

        # Save checkpoint
        if step % config.save_interval == 0:
            mgr.save(step, train_state)
            mgr.wait_until_finished()
            print(f"Saved checkpoint at step {step}")

        # Log metrics
        if step % config.log_interval == 0:
            print(f"Step {step}: {metrics}")
```

---

## Checkpoint Verification

```python
def verify_checkpoint(ckpt_path):
    """Verify checkpoint integrity"""
    mgr = ocp.CheckpointManager(ckpt_path, ocp.PyTreeCheckpointer())

    # Check available steps
    steps = mgr.all_steps()
    print(f"Available steps: {steps}")

    # Check latest
    latest = mgr.latest_step()
    print(f"Latest step: {latest}")

    # Try to load
    try:
        state = mgr.restore(latest)
        print(f"Successfully loaded checkpoint")

        # Verify structure
        def count_params(tree):
            return sum(x.size for x in jax.tree.leaves(tree))

        n_params = count_params(state.params)
        print(f"Total parameters: {n_params:,}")

        return True
    except Exception as e:
        print(f"Error loading checkpoint: {e}")
        return False
```

---

*Last updated: 2026-01-08 (TRC 마이그레이션: midyear-spot-480605-n5)*
