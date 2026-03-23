# mLSTM Mathematical Background

## Core Equations

### Standard LSTM vs mLSTM

**Standard LSTM:**
```
f_t = σ(W_f · [h_{t-1}, x_t])
i_t = σ(W_i · [h_{t-1}, x_t])
o_t = σ(W_o · [h_{t-1}, x_t])
c̃_t = tanh(W_c · [h_{t-1}, x_t])
c_t = f_t ⊙ c_{t-1} + i_t ⊙ c̃_t
h_t = o_t ⊙ tanh(c_t)
```

**mLSTM (Matrix LSTM):**
```
C_t = f_t · C_{t-1} + i_t · (v_t ⊗ k_t^T)   # Matrix cell state
n_t = f_t · n_{t-1} + i_t · k_t              # Normalizer
h_t = (C_t · q_t) / (n_t^T · q_t)            # Output (attention-like)
```

---

## Stabilizer State (Log-Sum-Exp Trick)

### Problem: Numerical Overflow

```python
# ❌ Naive implementation
f_t = exp(log_f)   # Can overflow if log_f large
i_t = exp(log_i)   # Can overflow if log_i large
```

### Solution: Stabilizer State m_t

```python
# ✅ Stable implementation
m_t = max(log_f + m_{t-1}, log_i)    # Stabilizer state
f_t = exp(log_f + m_{t-1} - m_t)     # Normalized forget (0-1)
i_t = exp(log_i - m_t)               # Normalized input (0-1)
```

**Why it works:**
```
Original: f_t * C_{t-1} + i_t * v_k
        = exp(log_f) * C_{t-1} + exp(log_i) * v_k

Stabilized:
        = exp(log_f + m_{t-1} - m_t) * C̃_{t-1} + exp(log_i - m_t) * v_k
        where C̃ is the "stabilized" cell state

The m_t factor cancels out in the final computation, but prevents intermediate overflow.
```

---

## Chunkwise Recurrence

### Why Chunkwise?

Standard recurrence is O(n) memory for backprop (need to store all states).
Chunkwise + remat gives O(chunk_size) memory.

### Chunk Processing

```python
def process_chunks(x, chunk_size):
    """Process sequence in chunks with carry"""
    n_chunks = seq_len // chunk_size

    # Initial carry (C, n, m for mLSTM)
    carry = init_carry()

    outputs = []
    for chunk_idx in range(n_chunks):
        chunk = x[:, chunk_idx * chunk_size : (chunk_idx + 1) * chunk_size]

        # Process chunk (this can be remat'd)
        carry, chunk_output = process_single_chunk(carry, chunk)
        outputs.append(chunk_output)

    return jnp.concatenate(outputs, axis=1)
```

### With JAX Scan + Remat

```python
def chunkwise_mlstm(x, params, chunk_size):
    chunks = x.reshape(batch, -1, chunk_size, d_model)

    def scan_fn(carry, chunk):
        # Remat this function for O(chunk_size) memory
        C, n, m = carry
        new_C, new_n, new_m, output = mlstm_chunk(C, n, m, chunk, params)
        return (new_C, new_n, new_m), output

    final_carry, outputs = jax.lax.scan(
        jax.checkpoint(scan_fn),  # Key: remat the scan body
        init_carry,
        chunks
    )

    return outputs.reshape(batch, seq_len, d_model)
```

---

## Gradient Flow Analysis

### Forget Gate and Gradient Vanishing

```
∂L/∂C_0 = ∂L/∂C_T · ∏_{t=1}^{T} f_t
```

If `f_t ≈ 1` for all t: gradient doesn't decay (can explode)
If `f_t ≈ 0` for all t: gradient vanishes

**Healthy range:** `0.5 < mean(f_t) < 0.95`

### Why f=1.0 Exactly is Problematic

```python
# When f = 1.0 exactly (bf16 rounding)
f_t = 1.0
C_t = 1.0 * C_{t-1} + i_t * v_k

# Gradient:
∂C_t/∂C_{t-1} = 1.0  # No decay!

# Over T steps:
∂C_T/∂C_0 = 1.0^T = 1.0  # Gradient accumulates without decay
```

**Fix:** Clamp f < 1 - ε

```python
f_t = jnp.clip(f_t, 0.0, 1.0 - 1e-4)
```

---

## Memory Complexity

### Standard mLSTM

| Component | Memory | Notes |
|-----------|--------|-------|
| C (cell state) | O(B × H × d_k × d_v) | Matrix per head |
| n (normalizer) | O(B × H × d_k) | Vector per head |
| m (stabilizer) | O(B × H) | Scalar per head |
| Activations | O(B × T × d) | Sequence length dependent |

### Chunkwise mLSTM

| Component | Memory | Notes |
|-----------|--------|-------|
| C, n, m | Same | Carry between chunks |
| Activations | O(B × chunk_size × d) | Only current chunk |

**Savings:** `T / chunk_size` reduction in activation memory

---

## Bidirectional mLSTM

### Forward + Backward Processing

```python
def bidirectional_mlstm(x):
    # Forward pass
    h_fwd = mlstm_forward(x)

    # Backward pass (reverse sequence)
    h_bwd = mlstm_forward(x[:, ::-1])[:, ::-1]

    # Combine
    h = concat([h_fwd, h_bwd], axis=-1)
    return h
```

### Memory Implication

Bidirectional = 2x memory for:
- 2x cell states (C_fwd, C_bwd)
- 2x normalizers (n_fwd, n_bwd)
- 2x activations

---

## Key Implementation Details

### Query-Key-Value Projection

```python
# Input: x [B, T, d_model]
q = W_q @ x  # [B, T, H, d_k]
k = W_k @ x  # [B, T, H, d_k]
v = W_v @ x  # [B, T, H, d_v]

# Outer product for cell update
v_k = v[:, :, :, :, None] * k[:, :, :, None, :]  # [B, T, H, d_v, d_k]
```

### Gate Computation

```python
# Forget gate (log scale for stability)
log_f = W_f @ x  # [B, T, H]

# Input gate (log scale)
log_i = W_i @ x  # [B, T, H]
```

### Output Computation

```python
# Query-weighted sum of cell state
numerator = C @ q    # [B, T, H, d_v]
denominator = n.T @ q  # [B, T, H]

# Normalized output
h = numerator / (denominator + eps)
```

---

## Scan Operator for Parallel Computation

### Associative Scan

mLSTM recurrence can be formulated as associative operation:

```python
def combine(a, b):
    """Combine two (f, i, v_k) tuples"""
    f_a, i_a, v_k_a = a
    f_b, i_b, v_k_b = b

    f_out = f_a * f_b
    i_out = f_b * i_a + i_b
    v_k_out = f_b * v_k_a + v_k_b

    return (f_out, i_out, v_k_out)

# Parallel scan
result = jax.lax.associative_scan(combine, (f, i, v_k))
```

**Complexity:** O(log T) parallel depth instead of O(T) sequential

---

*Last updated: 2024-12-23*
