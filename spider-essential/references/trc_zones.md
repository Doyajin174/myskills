# Google TPU Research Cloud (TRC) Zones

## TRC Program Overview

**Current TRC Allocation** (2026-01-08 마이그레이션 완료)
| 항목 | 값 |
|------|-----|
| **Project** | `midyear-spot-480605-n5` |
| **Account** | `saki7426@knou.ac.kr` |
| **Bucket** | `gs://spider-griffin-knou/` |
| **TRC 기간** | 2026-01-08 ~ 2026-02-08 |

**Requirement**: Spot instances only for v5e/v6e

---

## Available TPU Allocations

### TPU v6e (Latest Generation)

| Zone | Chips | Mode | Cost | Priority |
|------|-------|------|------|----------|
| `us-east1-d` | 64 | spot | **$0** | ★★★ Primary |
| `europe-west4-a` | 64 | spot | **$0** | ★★ Secondary |

**Non-TRC v6e Cost**: ~$12.88/hr for v6e-8

### TPU v5e

| Zone | Chips | Mode | Cost | Priority |
|------|-------|------|------|----------|
| `europe-west4-b` | 64 | spot | **$0** | ★★ |
| `us-central1-a` | 64 | spot | **$0** | ★★ |

### TPU v4

| Zone | Chips | Mode | Cost |
|------|-------|------|------|
| `us-central2-b` | 32 | on-demand | **$0** |
| `us-central2-b` | 32 | spot | **$0** |

---

## YAML Configuration

### v6e-8 (Recommended)

```yaml
resources:
  accelerators: tpu-v6e-8
  accelerator_args:
    runtime_version: v2-alpha-tpuv6e
  use_spot: true  # MUST be true for TRC!
  disk_size: 256
  any_of:
    - region: us-east1
      zone: us-east1-d      # Priority 1
    - region: europe-west4
      zone: europe-west4-a  # Priority 2 (failover)
```

### v5e-8

```yaml
resources:
  accelerators: tpu-v5e-8
  accelerator_args:
    runtime_version: tpu-ubuntu2204-base
  use_spot: true
  any_of:
    - region: europe-west4
      zone: europe-west4-b
    - region: us-central1
      zone: us-central1-a
```

### v4-8

```yaml
resources:
  accelerators: tpu-v4-8
  accelerator_args:
    runtime_version: tpu-ubuntu2204-base
  # Can use on-demand for v4
  use_spot: false  # or true
  region: us-central2
  zone: us-central2-b
```

---

## TPU Specifications

### TPU v6e-8

| Spec | Value |
|------|-------|
| HBM per chip | 31.25 GB |
| Total HBM | 250 GB (8 chips) |
| Interconnect | ICI (Inter-Core Interconnect) |
| FLOPS (bf16) | ~200 TFLOPS per chip |
| TDP | ~100W per chip |

### TPU v5e-8

| Spec | Value |
|------|-------|
| HBM per chip | 16 GB |
| Total HBM | 128 GB (8 chips) |
| FLOPS (bf16) | ~100 TFLOPS per chip |

### TPU v4-8

| Spec | Value |
|------|-------|
| HBM per chip | 32 GB |
| Total HBM | 256 GB (8 chips) |
| FLOPS (bf16) | ~275 TFLOPS per chip |

---

## Zone Selection Strategy

### Priority Order

1. **us-east1-d** (v6e) - Best availability
2. **europe-west4-a** (v6e) - Failover
3. **europe-west4-b** (v5e) - Alternative
4. **us-central1-a** (v5e) - Alternative
5. **us-central2-b** (v4) - Last resort

### Failover Configuration

```yaml
# Best practice: Multiple zones for auto-failover
any_of:
  - region: us-east1
    zone: us-east1-d
  - region: europe-west4
    zone: europe-west4-a
```

SkyPilot will automatically:
1. Try `us-east1-d` first
2. Fall back to `europe-west4-a` if unavailable
3. Handle preemption by spinning up in alternate zone

---

## Cost Monitoring

### Check Current Usage

```bash
# List running instances
gcloud compute tpus list --project=midyear-spot-480605-n5

# Check billing
gcloud billing accounts list
```

### Avoid Accidental Charges

```yaml
# ALWAYS include zone specification
resources:
  any_of:
    - zone: us-east1-d      # ✅ TRC free
    - zone: europe-west4-a  # ✅ TRC free
  # Never leave zone empty!
```

### Cost Breakdown

| Component | TRC Zone | Non-TRC Zone |
|-----------|----------|--------------|
| TPU v6e-8 | $0/hr | ~$12.88/hr |
| Controller VM | $0.18/hr | $0.18/hr |
| GCS Storage | $0.02/GB/mo | $0.02/GB/mo |

---

## Preemption Handling

### Spot Instance Behavior

- Can be preempted with ~30s warning
- No guaranteed availability
- Recommended: Use `sky jobs launch` for auto-recovery

### Recovery Strategy

```yaml
# SkyPilot handles recovery automatically with sky jobs
# Key settings:
resources:
  use_spot: true  # Enable spot (required for TRC)

# sky jobs launch will:
# 1. Detect preemption
# 2. Find alternate zone from any_of
# 3. Resume from latest checkpoint
```

### Manual Recovery

```bash
# If job fails:
# 1. Check status
sky jobs queue

# 2. Check logs for preemption
sky jobs logs <id> | grep -i preempt

# 3. Re-launch (will resume from checkpoint)
sky jobs launch -y <yaml>
```

---

## Runtime Versions

### v6e Runtime

```yaml
accelerator_args:
  runtime_version: v2-alpha-tpuv6e
```

### v5e/v4 Runtime

```yaml
accelerator_args:
  runtime_version: tpu-ubuntu2204-base
```

---

## Troubleshooting

### Zone Unavailable

```
ZONE_RESOURCE_POOL_EXHAUSTED
```

**Solution**: Add more zones to `any_of`

### Wrong Zone Selected

```
Billing account charges detected
```

**Solution**: Verify YAML has correct zone specification

### Preemption Loop

```
Instance preempted, retrying...
(repeated)
```

**Solution**: Try different time of day or use v4 (less demand)

---

*Last updated: 2026-01-08 (TRC 마이그레이션: midyear-spot-480605-n5)*
