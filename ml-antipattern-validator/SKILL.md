---
name: ml-antipattern-validator
description: Prevents 30+ critical AI/ML mistakes including data leakage, evaluation errors, training pitfalls, and deployment issues. Triggered when working with ML training, testing, model evaluation, dataset preparation, or AI architecture design. Validates against antipatterns that cause invalid results, misleading metrics, and production failures.
---

# ML Antipattern Validator

## Overview

This skill prevents critical mistakes in AI/ML development by detecting and blocking 30+ antipatterns across data handling, evaluation, training, statistics, deployment, and architecture. Use this skill proactively when designing ML systems, preparing datasets, training models, evaluating performance, or deploying to production.

**Key Principle**: Honest evaluation > Impressive metrics. Better to find problems early than discover them in production.

## When to Activate This Skill

**Automatic Triggers**:
- Working with ML training code (`train*.py`, `learn*.py`, model training)
- Dataset preparation or splitting (`dataset*.py`, data preprocessing)
- Model evaluation or testing (`test*.py`, `eval*.py`, metrics calculation)
- ML pipeline design (end-to-end workflows, AutoML)
- Performance benchmarking or comparison
- Production deployment planning

**Manual Triggers**:
- `@validate-ml` - Run full validation on current ML code
- `@check-leakage` - Focus on data leakage detection
- `@verify-eval` - Validate evaluation methodology

## Core Validation Framework

### Pre-Implementation Checklist

Before writing any ML code, verify:

```python
✅ Requirements Validation:
□ Problem clearly defined with success metrics
□ Data sources identified and accessible
□ Train/test split strategy defined
□ Evaluation methodology matches business objective
□ Deployment constraints understood

✅ Data Integrity:
□ No temporal leakage (future → past)
□ No target leakage (answer in features)
□ No preprocessing leakage (fit on all data)
□ No group leakage (related samples split)
□ Proper stratification for imbalanced classes

✅ Evaluation Setup:
□ Test set completely held out
□ Cross-validation appropriate for data type
□ Metrics aligned with business objective
□ Baseline models defined
□ Confidence intervals calculated
```

### Runtime Validation Checks

During development, continuously verify:

```python
✅ Training Phase:
□ Model.eval() / model.train() modes correct
□ Dropout disabled during inference
□ Batch normalization statistics frozen at test
□ Learning rate schedule appropriate
□ Early stopping patience reasonable

✅ Evaluation Phase:
□ Test on UNSEEN data only
□ No hyperparameter tuning on test set
□ Proper handling of OOV (out-of-vocabulary)
□ Confidence scores calibrated
□ Error analysis on failures

✅ Deployment Readiness:
□ Covariate shift monitoring planned
□ Concept drift detection implemented
□ Feedback loop contamination prevented
□ Rollback strategy defined
□ A/B testing framework ready
```

## Critical Antipatterns (30+)

### Category 1: Data Leakage Patterns 🚨

#### 1.1 Target Leakage
**Problem**: Features contain information only available after prediction time.

**Example**:
```python
❌ WRONG: Using "refund_issued" to predict "purchase_fraud"
# Refunds happen AFTER fraud detection

✅ CORRECT: Only use features available at purchase time
features = ['transaction_amount', 'device_id', 'time_of_day']
```

**Detection**:
```python
# Check feature-target correlation
correlation = df[features].corrwith(df['target'])
if (correlation.abs() > 0.95).any():
    raise DataLeakageError("Suspiciously high correlation detected")
```

#### 1.2 Temporal Leakage
**Problem**: Using future information to predict past events.

**Example**:
```python
❌ WRONG: Training on all data, testing on earlier dates
train = df[df['date'] > '2024-06-01']  # Future data
test = df[df['date'] < '2024-06-01']   # Past data

✅ CORRECT: Respect temporal ordering
train = df[df['date'] < '2024-06-01']  # Past for training
test = df[df['date'] >= '2024-06-01']  # Future for testing
```

**Detection**:
```python
if train['date'].min() > test['date'].max():
    raise TemporalLeakageError("Training on future, testing on past")
```

#### 1.3 Preprocessing Leakage
**Problem**: Fitting transformations on entire dataset before train/test split.

**Example**:
```python
❌ WRONG: Scale before split
X_scaled = scaler.fit_transform(X)  # Sees ALL data
X_train, X_test = train_test_split(X_scaled)

✅ CORRECT: Fit only on training data
X_train, X_test = train_test_split(X)
scaler.fit(X_train)  # Only training data
X_train_scaled = scaler.transform(X_train)
X_test_scaled = scaler.transform(X_test)
```

**Detection**:
```python
# Check if scaler was fit before split
if hasattr(scaler, 'n_samples_seen_'):
    if scaler.n_samples_seen_ > len(X_train):
        raise PreprocessingLeakageError("Scaler saw more samples than train set")
```

#### 1.4 Group Leakage
**Problem**: Related/correlated samples split across train and test sets.

**Example**:
```python
❌ WRONG: Random split with multiple samples per user
train_test_split(df, test_size=0.2)  # Same user in both sets

✅ CORRECT: Split by group (user_id, patient_id, etc.)
from sklearn.model_selection import GroupShuffleSplit
splitter = GroupShuffleSplit(test_size=0.2)
train_idx, test_idx = next(splitter.split(X, y, groups=df['user_id']))
```

**Detection**:
```python
# Check for group overlap
train_groups = set(df_train['user_id'])
test_groups = set(df_test['user_id'])
overlap = train_groups & test_groups
if overlap:
    raise GroupLeakageError(f"Found {len(overlap)} overlapping groups")
```

#### 1.5 Cross-Validation Fold Leakage
**Problem**: Preprocessing transformations applied across all folds.

**Example**:
```python
❌ WRONG: Fit imputer on all CV folds
imputer.fit(X)  # Sees all folds
cv_scores = cross_val_score(model, X_imputed, y)

✅ CORRECT: Use Pipeline to prevent leakage
from sklearn.pipeline import Pipeline
pipeline = Pipeline([
    ('imputer', SimpleImputer()),
    ('model', RandomForestClassifier())
])
cv_scores = cross_val_score(pipeline, X, y)  # Fit separately per fold
```

#### 1.6 Data Augmentation Leakage
**Problem**: Augmenting before train/test split creates near-duplicates.

**Example**:
```python
❌ WRONG: Augment then split
X_augmented = augment(X)  # Creates similar samples
X_train, X_test = train_test_split(X_augmented)  # Leakage!

✅ CORRECT: Split then augment training only
X_train, X_test = train_test_split(X)
X_train_augmented = augment(X_train)  # Only training data
```

### Category 2: Evaluation Mistakes ⚠️

#### 2.1 Testing on Training Data
**Problem**: Measuring memorization instead of generalization.

**Example**:
```python
❌ WRONG: Test on training sentences
dataset = load_training_data()
for sentence in dataset:  # Same data used for training!
    accuracy = evaluate(model, sentence)

✅ CORRECT: Separate unseen test set
train_data = load_training_data()
test_data = load_unseen_test_data()  # NEVER seen during training
accuracy = evaluate(model, test_data)
```

**Detection**:
```python
# Verify test samples not in training
train_hashes = set(hash(str(x)) for x in train_data)
test_hashes = set(hash(str(x)) for x in test_data)
overlap = train_hashes & test_hashes
if overlap:
    raise TestContaminationError(f"Found {len(overlap)} test samples in training data")
```

#### 2.2 Benchmark Contamination
**Problem**: Training data contains benchmark test sets.

**Example**:
```python
❌ WRONG: Training on web-scraped data that includes GLUE/SuperGLUE
model.train(web_corpus)  # May contain benchmark datasets!

✅ CORRECT: Filter out known benchmarks
filtered_corpus = remove_benchmark_contamination(
    web_corpus,
    benchmarks=['glue', 'superglue', 'squad', 'mmlu']
)
model.train(filtered_corpus)
```

**Detection**:
```python
# Check for n-gram overlap with benchmarks
def check_contamination(training_data, benchmark_data):
    train_ngrams = extract_ngrams(training_data, n=13)
    bench_ngrams = extract_ngrams(benchmark_data, n=13)
    overlap = train_ngrams & bench_ngrams
    contamination_rate = len(overlap) / len(bench_ngrams)
    if contamination_rate > 0.01:  # 1% threshold
        raise BenchmarkContaminationError(
            f"Found {contamination_rate:.2%} overlap with benchmark"
        )
```

#### 2.3 Metric Misalignment
**Problem**: Optimizing for wrong metric that doesn't match business objective.

**Example**:
```python
❌ WRONG: Optimizing accuracy for imbalanced fraud detection (99% non-fraud)
model.optimize(metric='accuracy')  # Predicting all "not fraud" gets 99%!

✅ CORRECT: Use precision/recall/F1 for imbalanced classes
model.optimize(metric='f1_score')  # Or precision_at_k
```

**Decision Matrix**:
```python
Business Objective → Appropriate Metric:
- Ranking (search, recommendations) → NDCG, MRR, MAP
- Imbalanced classification → F1, Precision@K, AUC-PR
- Balanced classification → Accuracy, AUC-ROC
- Regression (cost-sensitive) → MAE, Huber loss
- Regression (outlier-sensitive) → RMSE
- Multi-label → Hamming loss, subset accuracy
```

#### 2.4 Accuracy Paradox
**Problem**: High accuracy on imbalanced data by predicting majority class.

**Example**:
```python
❌ WRONG: 99% accuracy by always predicting "not fraud"
# Dataset: 99% legitimate, 1% fraud
model_accuracy = 0.99  # Seems great!
# But catches 0% of fraud cases

✅ CORRECT: Check per-class metrics
from sklearn.metrics import classification_report
print(classification_report(y_true, y_pred))
# Shows recall=0.0 for fraud class
```

**Detection**:
```python
# Check if model is just predicting majority class
unique, counts = np.unique(y_pred, return_counts=True)
if len(unique) == 1:
    raise AccuracyParadoxError("Model predicts only one class")

# Check class-wise recall
recalls = recall_score(y_true, y_pred, average=None)
if (recalls < 0.1).any():
    warnings.warn("Very low recall for some classes")
```

#### 2.5 Invalid Cross-Validation for Time Series
**Problem**: Random CV shuffles temporal data, causing future → past leakage.

**Example**:
```python
❌ WRONG: Random K-Fold on time series
cv_scores = cross_val_score(model, X, y, cv=5)  # Shuffles time!

✅ CORRECT: Use TimeSeriesSplit
from sklearn.model_selection import TimeSeriesSplit
tscv = TimeSeriesSplit(n_splits=5)
cv_scores = cross_val_score(model, X, y, cv=tscv)
```

#### 2.6 Hyperparameter Tuning on Test Set
**Problem**: Test set influences model selection, causing overfitting.

**Example**:
```python
❌ WRONG: Tune on test set
best_params = grid_search(model, X_test, y_test)  # Test set leakage!

✅ CORRECT: Use train/validation/test split
X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.3)
X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.5)

best_params = grid_search(model, X_train, y_train, validation=(X_val, y_val))
final_score = evaluate(model, X_test, y_test)  # Test set used once
```

### Category 3: Training Pitfalls 🔧

#### 3.1 Batch Normalization Inference Mode Error
**Problem**: Forgetting to set `model.eval()` during inference.

**Example**:
```python
❌ WRONG: Inference in training mode
# model.train() is still active
predictions = model(X_test)  # Uses batch statistics, non-deterministic!

✅ CORRECT: Switch to evaluation mode
model.eval()
with torch.no_grad():
    predictions = model(X_test)  # Uses running statistics, deterministic
```

**Detection**:
```python
# Check if model is in training mode during inference
if model.training:
    raise InferenceModeError("Model still in training mode during evaluation")
```

#### 3.2 Dropout at Test Time
**Problem**: Dropout enabled during inference causes non-deterministic predictions.

**Example**:
```python
❌ WRONG: Dropout active at test time
# model.eval() not called
pred1 = model(x)  # Different each time!
pred2 = model(x)  # Due to random dropout

✅ CORRECT: Disable dropout for inference
model.eval()  # Disables dropout automatically
pred = model(x)  # Deterministic
```

#### 3.3 Early Stopping Overfitting
**Problem**: Patience too large allows overfitting before stopping.

**Example**:
```python
❌ WRONG: Patience = 50 epochs
early_stop = EarlyStopping(patience=50)  # Overfits for 50 epochs!

✅ CORRECT: Reasonable patience with validation monitoring
early_stop = EarlyStopping(
    patience=5,  # Stop after 5 epochs without improvement
    min_delta=0.001,  # Minimum improvement threshold
    restore_best_weights=True  # Restore best model
)
```

#### 3.4 Learning Rate Warmup Mistakes
**Problem**: Starting with too high learning rate causes divergence.

**Example**:
```python
❌ WRONG: Large LR from start
optimizer = Adam(lr=1e-3)  # Too high initially

✅ CORRECT: Warmup from small LR
from transformers import get_linear_schedule_with_warmup
scheduler = get_linear_schedule_with_warmup(
    optimizer,
    num_warmup_steps=1000,  # Gradual increase
    num_training_steps=10000
)
```

#### 3.5 Inappropriate Model Capacity
**Problem**: Model too small to learn patterns, or too large and overfits.

**Example**:
```python
❌ WRONG: 10-parameter model for 1M samples
model = LinearRegression()  # Underfits complex patterns

❌ WRONG: 1M-parameter model for 100 samples
model = ResNet152()  # Overfits severely

✅ CORRECT: Match capacity to data size
# Rule of thumb: ~10 samples per parameter
n_params = len(X_train) // 10
model = SimpleNN(hidden_size=int(np.sqrt(n_params)))
```

#### 3.6 Class Imbalance with Standard Loss
**Problem**: Not using weighted loss for imbalanced classes.

**Example**:
```python
❌ WRONG: Standard loss on 99:1 imbalance
criterion = nn.CrossEntropyLoss()  # Biased toward majority

✅ CORRECT: Use class weights
class_weights = compute_class_weight('balanced', classes=np.unique(y), y=y)
criterion = nn.CrossEntropyLoss(weight=torch.tensor(class_weights))
```

### Category 4: Statistical Errors 📊

#### 4.1 P-Hacking
**Problem**: Multiple testing without Bonferroni or FDR correction.

**Example**:
```python
❌ WRONG: Test 100 hypotheses at α=0.05
for feature in features:  # 100 features
    p_value = test(feature, target)
    if p_value < 0.05:  # 5 false positives expected!
        print(f"{feature} is significant")

✅ CORRECT: Bonferroni correction
alpha = 0.05 / len(features)  # Corrected threshold
for feature in features:
    p_value = test(feature, target)
    if p_value < alpha:
        print(f"{feature} is significant")
```

#### 4.2 Selection Bias
**Problem**: Training on unrepresentative sample.

**Example**:
```python
❌ WRONG: Train on volunteer survey responses
train_data = voluntary_survey_responses  # Self-selection bias!

✅ CORRECT: Use random sampling or adjust for bias
from sklearn.utils import resample
train_data = resample(population, n_samples=1000, stratify=demographics)
```

#### 4.3 Survivorship Bias
**Problem**: Training only on successful outcomes, ignoring failures.

**Example**:
```python
❌ WRONG: Train stock predictor on companies still operating
train_data = currently_trading_stocks  # Ignores bankrupt companies!

✅ CORRECT: Include delisted/failed companies
train_data = pd.concat([
    currently_trading_stocks,
    delisted_stocks,
    bankrupt_companies
])
```

#### 4.4 Simpson's Paradox
**Problem**: Aggregated trend reverses when data is grouped.

**Example**:
```python
❌ WRONG: Aggregate without grouping
overall_effect = df['outcome'].mean()  # Positive

✅ CORRECT: Check subgroup effects
for group in df['group'].unique():
    group_effect = df[df['group'] == group]['outcome'].mean()
    # May find negative effect in all subgroups!
```

#### 4.5 Regression to the Mean
**Problem**: Misinterpreting natural variance as intervention effect.

**Example**:
```python
❌ WRONG: Select worst performers, re-test, claim improvement
worst = df[df['score'] < 20]  # Select extreme low
retest = measure_again(worst)
print(f"Improved by {retest.mean() - worst.mean()}")  # Natural regression!

✅ CORRECT: Use control group
treatment = df.sample(frac=0.5)
control = df.drop(treatment.index)
# Compare change in both groups
```

### Category 5: Deployment Issues 🚀

#### 5.1 Covariate Shift
**Problem**: P(X) changes between training and deployment.

**Example**:
```python
❌ WRONG: Deploy without monitoring input distribution
model.predict(production_data)  # Silently fails if distribution changed!

✅ CORRECT: Monitor input distribution shift
from scipy.stats import ks_2samp
for feature in features:
    statistic, p_value = ks_2samp(train[feature], production[feature])
    if p_value < 0.01:
        alert(f"Covariate shift detected in {feature}")
```

#### 5.2 Concept Drift
**Problem**: P(Y|X) changes over time (relationship between features and target).

**Example**:
```python
❌ WRONG: Never retrain model
model = load_model_from_2020()  # User behavior has changed!

✅ CORRECT: Monitor performance and retrain
performance_history = []
for batch in production_batches:
    current_performance = evaluate(model, batch)
    performance_history.append(current_performance)
    if detect_drift(performance_history):
        retrain_model(recent_data)
```

#### 5.3 Feedback Loop Poisoning
**Problem**: Model predictions influence future training data.

**Example**:
```python
❌ WRONG: Retrain on all user clicks
recommendations = model.predict(users)
clicks = collect_clicks(recommendations)  # Biased by model!
model.retrain(clicks)  # Reinforces existing biases

✅ CORRECT: Exploration vs exploitation
recommendations = [
    model.predict(user) if random() > 0.1  # 90% exploitation
    else random_recommendation()  # 10% exploration
    for user in users
]
# Exploration provides unbiased data
```

#### 5.4 Label Shift
**Problem**: P(Y) changes (class distribution changes).

**Example**:
```python
❌ WRONG: Ignore changing class proportions
# Training: 50% positive, 50% negative
# Production: 80% positive, 20% negative
model.predict(production_data)  # Threshold calibrated for 50/50!

✅ CORRECT: Recalibrate threshold for new distribution
from sklearn.calibration import CalibratedClassifierCV
calibrated_model = CalibratedClassifierCV(model, method='isotonic')
calibrated_model.fit(recent_data, recent_labels)
```

#### 5.5 Online Learning Memory Leakage
**Problem**: Test samples accidentally enter online training buffer.

**Example**:
```python
❌ WRONG: Add all incoming data to training buffer
for sample in production_stream:
    prediction = model.predict(sample)
    if sample.has_label():  # May include test samples!
        online_buffer.add(sample)

✅ CORRECT: Explicitly separate test set
test_sample_ids = load_test_ids()
for sample in production_stream:
    prediction = model.predict(sample)
    if sample.id not in test_sample_ids and sample.has_label():
        online_buffer.add(sample)
```

### Category 6: Architecture Mistakes 🏗️

#### 6.1 Softmax Temperature Miscalibration
**Problem**: Temperature not tuned, causing overconfident predictions.

**Example**:
```python
❌ WRONG: Default temperature=1.0
logits = model(x)
probs = softmax(logits)  # Overconfident [0.99, 0.005, 0.005]

✅ CORRECT: Calibrate temperature on validation set
best_temp = find_best_temperature(model, val_data)  # e.g., temp=2.5
probs = softmax(logits / best_temp)  # Calibrated [0.7, 0.2, 0.1]
```

#### 6.2 Bottleneck Layers Too Restrictive
**Problem**: Autoencoder bottleneck destroys information.

**Example**:
```python
❌ WRONG: 2-dimensional bottleneck for 1000-dim input
encoder = nn.Linear(1000, 2)  # Information loss!
decoder = nn.Linear(2, 1000)

✅ CORRECT: Use intrinsic dimensionality estimation
from sklearn.decomposition import PCA
pca = PCA(n_components=0.95)  # Preserve 95% variance
pca.fit(X_train)
bottleneck_dim = pca.n_components_  # e.g., 50

encoder = nn.Linear(1000, bottleneck_dim)
```

#### 6.3 Wrong Loss Function for Task
**Problem**: Loss function doesn't match evaluation metric.

**Example**:
```python
❌ WRONG: MSE loss when ranking is what matters
loss = nn.MSELoss()  # Cares about exact values
# But you're judged on ranking order!

✅ CORRECT: Use ranking loss
from pytorch_metric_learning.losses import TripletMarginLoss
loss = TripletMarginLoss()  # Optimizes ranking directly
```

#### 6.4 Ignoring Class Weights in Multi-Class
**Problem**: Rare classes get ignored during training.

**Example**:
```python
❌ WRONG: Standard loss for 100:10:1 class distribution
criterion = nn.CrossEntropyLoss()  # Focuses on majority class

✅ CORRECT: Use inverse frequency weights
from sklearn.utils.class_weight import compute_class_weight
class_weights = compute_class_weight(
    'balanced',
    classes=np.unique(y_train),
    y=y_train
)
criterion = nn.CrossEntropyLoss(weight=torch.tensor(class_weights))
```

## Validation Scripts

This skill includes automated validation scripts in `scripts/` directory:

### Data Leakage Detector
```bash
python scripts/validate_split.py --train train.csv --test test.csv
# Checks: temporal ordering, sample overlap, group leakage, preprocessing order
```

### Evaluation Validator
```bash
python scripts/validate_evaluation.py --test-data test.csv --train-data train.csv
# Checks: test contamination, metric alignment, class imbalance handling
```

### Deployment Readiness Checker
```bash
python scripts/validate_deployment.py --model model.pkl --production-data prod.csv
# Checks: covariate shift, concept drift, feedback loops
```

## Quick Reference: Common Scenarios

### Scenario 1: Splitting Time Series Data
```python
✅ CORRECT METHOD:
from sklearn.model_selection import TimeSeriesSplit

tscv = TimeSeriesSplit(n_splits=5)
for train_idx, test_idx in tscv.split(X):
    X_train, X_test = X[train_idx], X[test_idx]
    # Train always comes before test
    assert X_train.index.max() < X_test.index.min()
```

### Scenario 2: Evaluating Generalization
```python
✅ CORRECT METHOD:
# 1. Split data FIRST
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# 2. Train on training data
model.fit(X_train, y_train)

# 3. Test on UNSEEN test data
test_accuracy = model.score(X_test, y_test)  # Real generalization

# 4. Optionally: test on training data to measure memorization
train_accuracy = model.score(X_train, y_train)

# 5. Verify generalization
assert test_accuracy > 0.5, "Model not learning"
if train_accuracy > test_accuracy + 0.2:
    warnings.warn("Possible overfitting detected")
```

### Scenario 3: Handling Imbalanced Classes
```python
✅ CORRECT METHOD:
from sklearn.utils.class_weight import compute_class_weight
from sklearn.metrics import classification_report

# 1. Compute class weights
class_weights = compute_class_weight(
    'balanced',
    classes=np.unique(y_train),
    y=y_train
)

# 2. Use weighted loss
criterion = nn.CrossEntropyLoss(weight=torch.tensor(class_weights))

# 3. Evaluate with per-class metrics
print(classification_report(y_true, y_pred))  # Shows per-class recall
```

### Scenario 4: Preventing Benchmark Contamination
```python
✅ CORRECT METHOD:
# 1. Filter benchmark data from training
benchmark_hashes = load_benchmark_hashes()
training_data = [
    sample for sample in web_corpus
    if hash(sample) not in benchmark_hashes
]

# 2. Verify no contamination
def check_ngram_overlap(train, test, n=13):
    train_ngrams = set(extract_ngrams(train, n))
    test_ngrams = set(extract_ngrams(test, n))
    overlap = train_ngrams & test_ngrams
    contamination = len(overlap) / len(test_ngrams)
    assert contamination < 0.01, f"Contamination: {contamination:.2%}"
```

## Resources

### scripts/
- `validate_split.py` - Data splitting validation
- `detect_leakage.py` - Comprehensive leakage detection
- `validate_evaluation.py` - Evaluation methodology checker
- `check_deployment.py` - Production readiness validation

### references/
- `leakage_patterns.md` - Detailed leakage pattern catalog
- `evaluation_guidelines.md` - Proper evaluation methodology
- `deployment_checklist.md` - Production deployment guide
- `statistical_pitfalls.md` - Common statistical mistakes

---

**Remember**: Preventing these antipatterns is not about being perfect—it's about catching critical mistakes before they invalidate your results or cause production failures. When in doubt, validate early and validate often.
