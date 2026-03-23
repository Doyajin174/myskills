---
name: spider-essential
description: Essential skills for Spider AI/ML project - TPU TRC training, JAX/Flax debugging, mLSTM architecture, checkpoint management, and gate testing workflows. Auto-triggers on TPU training, NaN debugging, checkpoint issues, or mLSTM-related work.
integrates-with: [ml-antipattern-validator, safe-edit]
---

# Spider Essential Skills

> **Byte-Griffin-MoE TPU Training Mastery**

---

## 🚨 MANDATORY: 작업 전 체크리스트 (MUST READ FIRST)

**이 체크리스트를 완료하기 전에 어떤 작업도 시작하지 마라.**

### TPU/SkyPilot 작업 시 (sky jobs, TPU 관련)

```bash
# 1. ALWAYS 가상환경 먼저
cd griffin-lm
source .venv/bin/activate

# 2. ALWAYS 현재 상태 확인
sky jobs queue

# 3. 그 다음 작업 (launch, logs 등)
sky jobs launch -y -n <name> <yaml>
```

**❌ 절대 하지 마라:**
- venv 없이 `sky` 명령어 실행
- 상태 확인 없이 바로 launch

### 방식 선택 기준

| 상황 | 방식 | 이유 |
|------|------|------|
| 빠른 테스트 (< 30분) | `gcloud` 직접 | 오버헤드 없음, 가장 빠름 |
| 중간 작업 | `sky launch` | 편리함 + 빠름 |
| 장기 학습 (preemption 대비) | `sky jobs launch` | 자동 failover |

**gcloud 직접 방식 (테스트용):**
```bash
# 1. TPU 생성
gcloud compute tpus tpu-vm create d20-test \
  --zone=europe-west4-a \
  --accelerator-type=v6e-8 \
  --version=v2-alpha-tpuv6e \
  --preemptible

# 2. 파일 전송
gcloud compute tpus tpu-vm scp --recurse ./ d20-test:~/workdir \
  --zone=europe-west4-a --worker=all

# 3. 실행
gcloud compute tpus tpu-vm ssh d20-test --zone=europe-west4-a \
  --command="cd workdir && python train.py ..."

# 4. 정리
gcloud compute tpus tpu-vm delete d20-test --zone=europe-west4-a -q
```

### 코드 수정 작업 시

1. **기존 코드 먼저 확인** - 이미 있는 기능/파라미터인지 grep
2. **200줄 제한 확인** - 파일이 200줄 넘으면 모듈화
3. **하드코딩 금지** - 설정값은 config/argparse로

### 실패 시

1. `griffin-lm/failed_docs/`에 실패 노트 작성
2. 로드할 때 실패 노트 **절대 삭제 금지**

---

## Overview

Comprehensive skill set for Spider AI/ML project covering:
- TPU TRC (Research Cloud) job management
- JAX/Flax gradient debugging & NaN hunting
- mLSTM architecture patterns
- GCS checkpoint management
- Gate testing workflows

## When to Activate

**Auto-Triggers:**
- TPU training (`sky jobs`, `tpu-v6e`, SkyPilot)
- NaN debugging (`grad_nan`, `loss: nan`, `inf`)
- mLSTM work (`encoder`, `decoder`, `stabilizer`, `chunkwise`)
- Checkpoint issues (`orbax`, `gcsfs`, `checkpoint`)
- Memory issues (`OOM`, `RESOURCE_EXHAUSTED`, `HBM`)
- Gate testing (`max_bytes`, `gate test`, `context length`)

**Manual Triggers:**
- `@spider` - Full context
- `@tpu` - TPU TRC management
- `@nan` - NaN debugging workflow
- `@ckpt` - Checkpoint management
- `@gate` - Gate testing

---

## 0. Skill Integration (자동 연동)

Spider 프로젝트 작업 시 **자동으로 함께 활성화**되는 스킬:

| 상황 | 추가 활성화 | 이유 |
|------|------------|------|
| `train*.py` 수정 | `ml-antipattern-validator` | Data leakage, eval 검증 |
| `eval*.py` 작성 | `ml-antipattern-validator` | Metric 적합성 검증 |
| 코드 파일 수정 | `safe-edit` | 자동 백업, diff 저장 |
| 데이터셋 처리 | `ml-antipattern-validator` | Split leakage 방지 |

### ML Antipattern 검증 필수 항목 (Spider 특화)

```python
# Spider 프로젝트에서 주의할 ML 안티패턴:

✅ Data Leakage 검증:
□ Train/test temporal ordering (시계열 데이터)
□ Preprocessing fit은 train only
□ Benchmark contamination 없음

✅ Evaluation 검증:
□ Test set은 학습에 절대 사용 안 함
□ Router entropy/utilization 정상
□ Loss metric이 task에 적합

✅ Training 검증:
□ model.eval() at inference
□ Gradient clipping 적용
□ Learning rate warmup
```

### Safe Edit 연동

```bash
# Spider 코드 수정 전 자동 실행:
1. .backups/YYYY-MM-DD/에 백업 생성
2. /tmp/diffs/에 변경사항 저장
3. 200줄 초과 시 모듈화 권고
```

---

## 1. TPU TRC Management

### TRC Free Zones (CRITICAL!)

| TPU | Zone | Mode | Cost |
|-----|------|------|------|
| **v6e** | `us-east1-d` | spot | **$0** |
| **v6e** | `europe-west4-a` | spot | **$0** |
| v5e | `europe-west4-b` | spot | $0 |
| v5e | `us-central1-a` | spot | $0 |

**Warning**: Zone 미지정 = **$12.88/hr** 과금!

### YAML Template (v6e-8)

```yaml
resources:
  accelerators: tpu-v6e-8
  accelerator_args:
    runtime_version: v2-alpha-tpuv6e
  use_spot: true  # TRC v6e는 spot만 무료!
  any_of:
    - region: us-east1
      zone: us-east1-d
    - region: europe-west4
      zone: europe-west4-a
```

### SkyPilot Commands

```bash
# Launch (managed)
sky jobs launch -y -n <name> <yaml>

# Quick test (no controller cost)
sky launch -y <yaml>

# Monitor
sky jobs queue
sky jobs logs <id>

# Shutdown (비용 절약!)
sky down -a -y
sky jobs cancel <id> -y
```

### Environment Variables

```bash
export JAX_PLATFORMS=tpu,cpu
export XLA_PYTHON_CLIENT_MEM_FRACTION=0.95
export JAX_TRACEBACK_FILTERING=off
export TF_CPP_MIN_LOG_LEVEL=0
```

---

## 2. JAX/Flax NaN Debugging

### NaN Detection Pattern

```python
# Step 1: Identify NaN location
def debug_nan_grads(grads):
    """Count NaN in gradient tree"""
    def count_nan(x):
        if x is None:
            return 0
        return jnp.sum(jnp.isnan(x)).item()

    nan_counts = jax.tree.map(count_nan, grads)
    return jax.tree.map(lambda x: x, nan_counts)  # Print-friendly

# Usage in train step
grads = jax.grad(loss_fn)(params)
nan_info = debug_nan_grads(grads)
print(f"NaN counts: {nan_info}")
```

### Cotangent Probe Pattern

```python
@jax.custom_vjp
def probe_cotangent(x, name="probe"):
    """Inspect gradients during backward pass"""
    return x

def probe_fwd(x, name):
    return x, (x, name)

def probe_bwd(res, g):
    x, name = res
    # Print gradient stats
    jax.debug.print(
        "[PROBE {name}] g: shape={shape} nan={nan} inf={inf} min={min} max={max}",
        name=name,
        shape=g.shape,
        nan=jnp.sum(jnp.isnan(g)),
        inf=jnp.sum(jnp.isinf(g)),
        min=jnp.nanmin(g),
        max=jnp.nanmax(g),
    )
    return (g, None)

probe_cotangent.defvjp(probe_fwd, probe_bwd)
```

### Common NaN Sources

| Source | Pattern | Fix |
|--------|---------|-----|
| Softmax overflow | `exp(large)` | Temperature scaling |
| Log of zero | `log(0)` | `log(x + eps)` |
| Division by zero | `1/x` where x→0 | Clamp denominator |
| Forget gate saturation | `f=1.0` exactly | `clip(f, 0, 1-1e-4)` |
| Zero padding gradient | Sparse gradients | Edge padding |
| Remat double-wrap | `nn.remat` + `jax.checkpoint` | Use one only |

### Debugging Checklist

```
□ Forward pass finite? (loss, logits)
□ Backward NaN count? (per-layer)
□ Which layer? (encoder/decoder/griffin/moe)
□ Parameter or activation gradient?
□ Add cotangent probes at suspects
□ Check numerical stability (f32 vs bf16)
□ Check remat nesting
```

---

## 3. mLSTM Architecture

### 3-Stage Pipeline

```
Raw Bytes → [mLSTM Encoder] → [Griffin-MoE] → [mLSTM Decoder] → Output
            ↓                  ↓               ↓
         Patch화              Linear          Byte 복원
         (4→1)               Recurrence      (1→4)
```

### Stabilizer State (수치 안정성 핵심)

```python
# Log-sum-exp trick for numerical stability
m_t = jnp.maximum(log_f + m_prev, log_i)  # stabilizer state
f_t = jnp.exp(log_f + m_prev - m_t)       # stabilized forget
i_t = jnp.exp(log_i - m_t)                # stabilized input

# C, n update (MUST be f32 for accumulation)
C_t = f_t * C_prev + i_t * (v @ k.T)
n_t = f_t * n_prev + i_t * k
```

### Chunkwise Processing

```python
# O(1) memory per chunk (with remat)
def process_chunk(carry, chunk):
    C, n, m = carry
    # Process chunk
    C_new, n_new, m_new, output = mlstm_chunk(C, n, m, chunk)
    return (C_new, n_new, m_new), output

# Scan with carry
final_carry, outputs = jax.lax.scan(
    jax.checkpoint(process_chunk),  # Remat for O(1)
    init_carry,
    chunks
)
```

### Precision Rules

| Component | Precision | Reason |
|-----------|-----------|--------|
| State storage | bf16 | Memory 50% ↓ |
| Gate computation | f32 | Numerical stability |
| C/n accumulation | f32 | Prevent overflow |
| Output | bf16 | Memory efficient |

---

## 4. Checkpoint Management

### GCS Path Pattern (SSOT: 2026-01-08)

```bash
# 현행 운영 버킷 (midyear-spot-480605-n5)
GCS_BUCKET="gs://spider-griffin-knou"

# Stage1 체크포인트 (default: ckpt_211500, Code PPL: 23.46)
gs://spider-griffin-knou/data-mix-v0/datamix-v0-stage1/stage1-seed42-v1/ckpt_<STEP>.npz

# Stage2 체크포인트 (default: ckpt_284500, Code PPL: 20.60)
gs://spider-griffin-knou/data-mix-v0/datamix-v0-stage2/stage2-seed42-v1/ckpt_<STEP>.npz

# 메타데이터
best_ckpt.json    # Best PPL checkpoint step
ppl_history.json  # PPL evaluation history
```

> **운영 정책**: Best PPL 체크포인트 우선 사용
> - Stage1: ckpt_211500 (ckpt_214000은 비교/재현 전용)
> - Stage2: ckpt_284500 (ckpt_305000은 비교/재현 전용)

### Version Pinning (CRITICAL)

```bash
# gcsfs 버전 불일치 → 체크포인트 실패
pip install "fsspec==2025.12.0" "gcsfs==2025.12.0"
```

### Orbax Async Save

```python
# MUST wait for completion
manager.save(step, train_state)
manager.wait_until_finished()  # 필수!
```

### Resume from Checkpoint

```python
# Find latest checkpoint
import orbax.checkpoint as ocp

mgr = ocp.CheckpointManager(
    checkpoint_dir,
    ocp.PyTreeCheckpointer(),
)
latest_step = mgr.latest_step()

if latest_step is not None:
    train_state = mgr.restore(latest_step)
    print(f"Resumed from step {latest_step}")
```

### Checkpoint Debug Commands

```bash
# List GCS checkpoints
gsutil ls gs://bucket/path/

# Check checkpoint integrity
python -c "
import orbax.checkpoint as ocp
mgr = ocp.CheckpointManager('gs://bucket/path', ocp.PyTreeCheckpointer())
print(f'Steps: {mgr.all_steps()}')
print(f'Latest: {mgr.latest_step()}')
"
```

---

## 5. Gate Testing Workflow

### Memory Safety Matrix (256M on v6e-8)

| batch | max_bytes | ~GB/chip | Status |
|-------|-----------|----------|--------|
| 8 | 1024 | 15 | ✅ Safe |
| 8 | 2048 | 22 | ✅ Safe |
| 8 | 4096 | 35 | ⚠️ Risk |
| 8 | 8192 | 65 | ❌ OOM |

### Gate Test Progression

```
control768 → A-2.1(1024) → A-2.2(1536) → A-2.3(2048) → A-2.4(3072)
```

### Gate Pass Criteria

```
✅ No OOM (compile + runtime)
✅ No NaN/Inf
✅ Router Entropy > 0.6
✅ Router Utilization > 0.2
✅ Checkpoint saved (ckpt_51500)
```

### Gate Test Commands

```bash
# Launch gate test
sky jobs launch -y -n byte-griffin-a24 \
  configs/skypilot/gate-tests/skypilot-byte-griffin-256m-a24-3072.yaml

# Monitor
sky jobs logs <id> 2>&1 | grep -E "Step|OOM|NaN|Router" | tail -20

# Check success
sky jobs logs <id> --no-follow | grep "ckpt_51500"
```

### Memory Optimization Priority

| Priority | Strategy | Savings | Accuracy |
|----------|----------|---------|----------|
| 1 | bf16 state | ~50% | Very Low |
| 2 | Selective remat | Activation | None |
| 3 | Chunk + remat | O(chunk) | None |
| 4 | Gradient accum | Guaranteed | None |
| Last | d_state 축소 | ~44% | **Medium** |

---

## 6. FSDP Rules (TPU v6e-8)

### Divisibility Rules

```python
# 모든 샤딩 차원은 8로 나누어 떨어져야 함
batch_size = 8       # ✅ 8 % 8 == 0
conv_kernel = 8      # ✅ 8 % 8 == 0
patch_size = 8       # ✅ 8 % 8 == 0

# Feature 차원은 128의 배수 권장
d_model = 1024       # ✅ 1024 = 128 × 8
n_heads = 16         # ✅ 16 = 8 × 2
```

### Sharding Strategy

```python
# 1MB 미만: 복제
# 1MB 이상: FSDP 샤딩 (if divisible by 8)
def get_sharding(x, num_devices=8):
    size = np.prod(x.shape) * 2  # bf16
    if size < 1_000_000:
        return P()  # 복제
    if len(x.shape) >= 2 and x.shape[0] % num_devices == 0:
        return P('fsdp', None)
    return P()  # 샤딩 불가 → 복제
```

---

## 7. Known Bugs & Workarounds

### RoPE Shape Mismatch (local_attention.py)

**Error:**
```
TypeError: mul got incompatible shapes for broadcasting: (1, 32, 16, 64), (1, 16, 1, 64)
```

**Location:** `layers/attention/local_attention.py:88` → `apply_rope(q, cos, sin)`

**Cause:** RoPE frequency tensor shape이 QKV head 수와 불일치

**Workaround:** Attention 비활성화 (mLSTM만 테스트 시)
```bash
# train_byte_griffin_tpu.py에 인자 추가 필요
--attention_layer_interval 999999
```

**Status:** 미해결 (별도 수정 필요)

### Preemption Recovery 실패

**Error:** Resume 시 checkpoint mismatch

**Workaround:**
```bash
--resume_step -1  # 가장 최근 checkpoint 자동 탐색
```

---

## 8. NaN Probe Test Workflow

### Step 1: Attention 비활성화

mLSTM NaN 디버깅 시 attention 관련 버그를 우회:

```yaml
# YAML에서:
python train_byte_griffin_tpu.py \
  --attention_layer_interval 999999 \  # attention 완전 비활성화
  --learning_rate 0 \                   # weight update 없이 gradient만 확인
  --aux_loss_weight 0 \                 # MoE loss 영향 제거
  --run_steps 2                         # 최소 step만 실행
```

### Step 2: Probe 배치

```python
# core_chunkwise.py 또는 cell.py에 probe 추가
from spider_griffin_moe.layers.mlstm.cell import _probe_cotangent_cell

# 예시: cell.py에서
v = _probe_cotangent_cell("d_v", v)
k = _probe_cotangent_cell("d_k", k)
```

### Step 3: Log 필터

```bash
# Probe prefix로 필터링
sky jobs logs <id> 2>&1 | grep -E "\[P0\.6-D-\d+\]"

# Core probe 전용
sky jobs logs <id> 2>&1 | grep -E "\[P0\.6-D-19\]"
```

### Step 4: Decision Tree

```
Forward pass finite? (loss, logits)
├─ No → Input/embedding 문제
└─ Yes → Backward pass 확인
   │
   NaN 위치 확인 (encoder/decoder/griffin)
   ├─ Griffin = 0, mLSTM ≠ 0 → mLSTM core 문제
   │   ├─ d_qkv NaN → qkv_proj backward
   │   ├─ d_k/d_v NaN, d_q clean → vk outer product
   │   ├─ d_conv NaN → conv1d backward
   │   └─ d_silu NaN → silu backward
   └─ Griffin ≠ 0 → RG-LRU 또는 MoE 문제
```

### Probe Naming Convention

| Prefix | 의미 |
|--------|------|
| `[P0.6-D-XX]` | P0.6 milestone, Debug job XX |
| `d_*` | Cotangent (backward gradient) |
| `post_*` | Forward output |
| `pre_*` | Forward input |

---

## 9. Essential CLI Arguments

### train_byte_griffin_tpu.py

| Argument | Default | Description |
|----------|---------|-------------|
| `--model_size` | `256m` | 65m, 256m, 1.5b |
| `--max_bytes` | 2048 | Context length |
| `--batch_size` | 8 | Per-pod batch |
| `--learning_rate` | 3e-4 | Peak LR |
| `--attention_layer_interval` | 5 | N layers마다 attention (999999=off) |
| `--aux_loss_weight` | 0.01 | MoE auxiliary loss (0=off) |
| `--run_steps` | None | 실행할 step 수 (None=total_steps) |
| `--resume_step` | None | Resume할 step (-1=latest) |
| `--require_hf_data` | False | Synthetic fallback 금지 |

---

## Quick Reference

### Log Pattern Matching

```bash
# Success indicators
grep -E "Step.*Loss.*Speed" logs.txt

# Error indicators
grep -E "OOM|NaN|Inf|Error|EXHAUSTED" logs.txt

# Router health
grep -E "\[Router\].*Ent.*Util" logs.txt

# Data source (synthetic = bad!)
grep "DATA_SOURCE" logs.txt
```

### File Locations

| Item | Path |
|------|------|
| Entry point | `train_byte_griffin_tpu.py` |
| mLSTM core | `layers/mlstm/core.py` |
| mLSTM chunkwise | `layers/mlstm/core_chunkwise.py` |
| Encoder | `layers/mlstm/encoder.py` |
| Decoder | `layers/mlstm/decoder.py` |
| Router | `layers/moe/router.py` |
| Sharding | `training/sharding/` |
| Main YAML | `skypilot-byte-griffin-256m-tpu.yaml` |
| Gate YAMLs | `configs/skypilot/gate-tests/` |

### Emergency Commands

```bash
# 모든 TPU 종료 (비용 즉시 중단)
sky down -a -y

# Job 취소
sky jobs cancel -a -y

# Controller 종료
echo "delete" | sky down sky-jobs-controller-*
```

---

## Resources

- `references/trc_zones.md` - TRC zone 상세
- `references/nan_debugging.md` - NaN 디버깅 패턴
- `references/mlstm_math.md` - mLSTM 수학적 배경
- `references/checkpoint_guide.md` - 체크포인트 관리

---

*Last updated: 2026-01-08 (TRC 마이그레이션: midyear-spot-480605-n5)*
