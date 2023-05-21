use crate::consts::{HashFunctionCount, ItemsCount};
use std::cmp;

pub fn calculate_filter_size(item_count: u32, false_positive_rate: f64) -> u32 {
  // Casting to f64 to allow for floating point operations
  let n = item_count as f64;
  let p = false_positive_rate;

  // lg(2)^2
  let log2_exp2 = f64::ln(2.0_f64).powf(2.0_f64);

  // Calculate the size of the filter in bits
  // and round up to the nearest integer as we can't have a fraction of a bit
  let filter_size = -(n * f64::ln(p)) / log2_exp2;

  // Ensure we always return at least 1 bit
  cmp::max(filter_size.ceil() as u32, 1)
}

pub fn calculate_required_hash_functions(bits: usize, items_count: ItemsCount) -> u32 {
  // Casting to f64 to allow for floating point operations
  let m: f64 = bits as f64;
  let n = items_count as f64;

  // ln(2)
  let log2 = f64::ln(2.0_f64);

  // Calculate the optimal number of hash functions to use
  // and round up to the nearest integer as we can't have a fraction of a hash function
  let k = (m / n * log2).ceil() as HashFunctionCount;

  // Ensure we always return at least 1 hash function
  cmp::max(k, 1)
}

pub fn hash(value: &str, seed: usize) -> usize {
  xxhash_rust::xxh64::xxh64(value.as_bytes(), seed as u64)
    .try_into()
    .unwrap()
}

pub fn modulo(value: &str, seed: usize, vector_size: usize) -> usize {
  (hash(value, seed) % vector_size).try_into().unwrap()
}
