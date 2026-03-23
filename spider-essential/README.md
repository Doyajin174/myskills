# Spider Essential Skills

> 🕷️ Essential skills for Byte-Griffin-MoE TPU Training

## Quick Start

```
@spider - Full context activation
@tpu    - TPU TRC management
@nan    - NaN debugging workflow
@ckpt   - Checkpoint management
@gate   - Gate testing protocol
```

## Skills Included

| Skill | Description |
|-------|-------------|
| **TPU TRC** | Free zone management, SkyPilot commands, YAML templates |
| **NaN Debugging** | Cotangent probes, gradient inspection, common patterns |
| **mLSTM** | Stabilizer state, chunkwise processing, precision rules |
| **Checkpoint** | GCS setup, Orbax async, resume training |
| **Gate Testing** | Memory matrix, pass criteria, progression |
| **FSDP** | Divisibility rules, sharding strategy |

## File Structure

```
spider-essential/
├── SKILL.md              # Main skill file
├── README.md             # This file
└── references/
    ├── nan_debugging.md  # NaN hunting patterns
    ├── mlstm_math.md     # mLSTM mathematics
    ├── checkpoint_guide.md # GCS checkpoint guide
    └── trc_zones.md      # TRC zone reference
```

## Auto-Triggers

Activates automatically when:
- Working with TPU training (`sky jobs`, `tpu-v6e`)
- Debugging NaN/Inf (`grad_nan`, `loss: nan`)
- mLSTM work (`encoder`, `decoder`, `chunkwise`)
- Checkpoint issues (`orbax`, `gcsfs`)
- Memory optimization (`OOM`, `HBM`)

## Quick Reference

### TRC Free Zones
```
v6e: us-east1-d, europe-west4-a (spot only!)
v5e: europe-west4-b, us-central1-a
v4:  us-central2-b
```

### Essential Commands
```bash
# Launch
sky jobs launch -y -n <name> <yaml>

# Monitor
sky jobs logs <id>

# Shutdown (save $$$)
sky down -a -y
```

### NaN Debug Checklist
```
□ Forward finite?
□ Where is NaN? (encoder/decoder/griffin)
□ Parameter or activation grad?
□ Add cotangent probes
□ Check bf16 vs f32
```

## Related Skills

- `ml-antipattern-validator` - Prevent ML mistakes
- `safe-edit` - Safe file modifications
- `/sc:tpu` - Quick TPU reference

---

*For the Spider AI/ML team*
