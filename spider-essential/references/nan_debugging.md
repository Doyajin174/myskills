# JAX/Flax NaN Debugging Guide

## NaN Debugging Systematic Approach

### Step 1: Localize NaN

```python
def count_nans_in_tree(pytree, prefix=""):
    """Recursively count NaNs in a pytree"""
    results = {}

    def visitor(path, x):
        if isinstance(x, jnp.ndarray):
            nan_count = int(jnp.sum(jnp.isnan(x)))
            if nan_count > 0:
                path_str = "/".join(str(p) for p in path)
                results[f"{prefix}{path_str}"] = nan_count

    jax.tree_util.tree_map_with_path(visitor, pytree)
    return results
```

### Step 2: Add Cotangent Probes

```python
@jax.custom_vjp
def probe(x, name=""):
    """Identity function with gradient inspection"""
    return x

def probe_fwd(x, name):
    return x, (x, name)

def probe_bwd(res, g):
    x, name = res
    nan_count = jnp.sum(jnp.isnan(g))
    inf_count = jnp.sum(jnp.isinf(g))

    jax.debug.print(
        "[PROBE {n}] shape={s} nan={nan} inf={inf} range=[{min:.3e}, {max:.3e}]",
        n=name,
        s=g.shape,
        nan=nan_count,
        inf=inf_count,
        min=jnp.nanmin(g),
        max=jnp.nanmax(g),
    )
    return (g, None)

probe.defvjp(probe_fwd, probe_bwd)

# Usage
x = probe(x, "after_attention")
```

### Step 3: Bisect the Model

```python
# Add probes at strategic points
class DebugModel(nn.Module):
    def __call__(self, x):
        x = probe(x, "input")

        x = self.encoder(x)
        x = probe(x, "after_encoder")

        x = self.griffin_layers(x)
        x = probe(x, "after_griffin")

        x = self.decoder(x)
        x = probe(x, "after_decoder")

        return x
```

---

## Common NaN Patterns

### Pattern 1: Softmax Overflow

**Symptom**: NaN after attention or routing
**Cause**: Large logits → exp overflow

```python
# ❌ Problem
logits = large_values  # > 88 for float32
probs = jnp.exp(logits) / jnp.sum(jnp.exp(logits))  # inf/inf = NaN

# ✅ Fix: Use stable softmax
logits_max = jnp.max(logits, axis=-1, keepdims=True)
logits_stable = logits - logits_max
probs = jax.nn.softmax(logits_stable)
```

### Pattern 2: Log of Zero

**Symptom**: NaN in loss computation
**Cause**: log(0) = -inf, operations with -inf → NaN

```python
# ❌ Problem
log_probs = jnp.log(probs)  # probs can be 0 after softmax

# ✅ Fix: Add epsilon
eps = 1e-10
log_probs = jnp.log(probs + eps)

# Or use log_softmax directly
log_probs = jax.nn.log_softmax(logits)
```

### Pattern 3: Division by Small Numbers

**Symptom**: Gradients explode then NaN
**Cause**: 1/x where x → 0

```python
# ❌ Problem
normalized = x / norm  # norm can be very small

# ✅ Fix: Clamp denominator
eps = 1e-6
normalized = x / jnp.maximum(norm, eps)
```

### Pattern 4: Forget Gate Saturation (mLSTM-specific)

**Symptom**: Gradient NaN in recurrent layers
**Cause**: f=1.0 exactly → no gradient decay → explosion

```python
# ❌ Problem
f_t = jnp.exp(log_f)  # Can be exactly 1.0 in bf16

# ✅ Fix: Clamp to prevent saturation
f_t = jnp.clip(f_t, 0.0, 1.0 - 1e-4)
```

### Pattern 5: Zero Padding Gradient Amplification

**Symptom**: NaN at sequence boundaries
**Cause**: Zero padding → sparse gradients → accumulation issues

```python
# ❌ Problem
x_padded = jnp.pad(x, pad_width, mode='constant')  # Zeros

# ✅ Fix: Use edge padding
x_padded = jnp.pad(x, pad_width, mode='edge')
```

### Pattern 6: Remat Double-Wrapping

**Symptom**: NaN only with checkpointing enabled
**Cause**: `nn.remat` + `jax.checkpoint` double-wrap

```python
# ❌ Problem
@nn.remat
def layer(x):
    return jax.checkpoint(heavy_computation)(x)

# ✅ Fix: Use one or the other
@nn.remat
def layer(x):
    return heavy_computation(x)
```

---

## Debugging by Layer Type

### mLSTM Encoder/Decoder

1. Check stabilizer state overflow:
```python
jax.debug.print("m_t range: [{}, {}]", jnp.min(m_t), jnp.max(m_t))
```

2. Check C, n accumulation:
```python
jax.debug.print("C norm: {}", jnp.linalg.norm(C))
jax.debug.print("n norm: {}", jnp.linalg.norm(n))
```

3. Check gate values:
```python
jax.debug.print("f range: [{}, {}]", jnp.min(f), jnp.max(f))
jax.debug.print("i range: [{}, {}]", jnp.min(i), jnp.max(i))
```

### MoE Router

1. Check router logits:
```python
jax.debug.print("router logits: max={}, min={}", jnp.max(logits), jnp.min(logits))
```

2. Check expert load balance:
```python
jax.debug.print("expert_counts: {}", expert_counts)
```

### Attention

1. Check QKV values:
```python
jax.debug.print("Q norm: {}", jnp.linalg.norm(Q))
jax.debug.print("attention_weights max: {}", jnp.max(attn_weights))
```

---

## Emergency Debug Script

```python
def emergency_nan_debug(model, params, batch):
    """Full NaN diagnostic"""

    # 1. Forward pass check
    logits = model.apply(params, batch, train=False)
    print(f"Forward NaN: {jnp.sum(jnp.isnan(logits))}")

    # 2. Loss check
    loss = compute_loss(logits, batch['labels'])
    print(f"Loss: {loss}, isnan: {jnp.isnan(loss)}")

    # 3. Gradient check
    def loss_fn(p):
        return compute_loss(model.apply(p, batch), batch['labels'])

    grads = jax.grad(loss_fn)(params)
    nan_info = count_nans_in_tree(grads)
    print(f"Gradient NaN locations: {nan_info}")

    # 4. Per-layer breakdown
    for layer_name, layer_grads in grads.items():
        nan_count = sum(count_nans_in_tree(layer_grads).values())
        print(f"  {layer_name}: {nan_count} NaNs")
```

---

## bf16 vs f32 Considerations

| Operation | bf16 Safe? | Notes |
|-----------|------------|-------|
| Matrix multiply | ✅ | XLA handles accumulation |
| Softmax | ⚠️ | Use f32 for numerator |
| Log | ⚠️ | Cast to f32 first |
| Exp | ❌ | Overflows at ~88 |
| Division | ⚠️ | Clamp denominator |
| Accumulation | ❌ | Use f32 for scan |

```python
# Safe bf16 pattern
def safe_operation(x):
    x_f32 = x.astype(jnp.float32)
    result = dangerous_op(x_f32)
    return result.astype(jnp.bfloat16)
```

---

*Last updated: 2024-12-23*
