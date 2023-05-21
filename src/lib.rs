#![deny(clippy::all)]

mod consts;
mod zoomies;

use bitvec::prelude::*;
use napi::bindgen_prelude::*;

#[macro_use]
extern crate napi_derive;

/// Calculates the required size of the filter in bits
/// ```rust
/// filter_size = - (item_count * lg(false_positive_rate)) / (lg(2)^2)
/// ```
#[napi]
pub fn calculate_filter_size(item_count: u32, false_positive_rate: f64) -> u32 {
  zoomies::calculate_filter_size(item_count, false_positive_rate)
}

/// Calculates the optimal number of hash functions to use
/// ```rust
/// hash_fns_required = (bits / item_count) * ln(2)
/// ```
#[napi]
pub fn calculate_required_hash_functions(bits: BigInt, items_count: u32) -> u32 {
  zoomies::calculate_required_hash_functions(
    bits.get_u128().1.try_into().unwrap(),
    items_count.try_into().unwrap(),
  )
}

#[napi(js_name = "Zoomies")]
pub struct Zoomies {
  bits: BitVec,
  hash_fns: u32,
}

#[napi]
impl Zoomies {
  /// Create a new bloom filter with the given number of items and false positive rate
  /// ```rust
  /// let bloom_filter = BloomFilter::new(100, 0.01); // 100 items, 1% false positive rate
  /// ```
  #[napi(constructor)]
  pub fn new(item_count: u32, false_positive_rate: f64) -> Self {
    let size = zoomies::calculate_filter_size(item_count, false_positive_rate);
    let hash_fns = zoomies::calculate_required_hash_functions(size.try_into().unwrap(), item_count);

    Self {
      bits: bitvec![0; size.try_into().unwrap()],
      hash_fns,
    }
  }

  #[napi(factory)]
  pub fn new_from_compiled_filter(bit_filter: Buffer, hash_fns: u32) -> Self {
    let mut new_filter = bitvec![0; bit_filter.len()];

    for (i, bit) in bit_filter.iter().enumerate() {
      new_filter.set(i, *bit == 1);
    }

    Self {
      bits: new_filter,
      hash_fns,
    }
  }

  /// Insert an address into the filter
  #[napi]
  pub fn insert_address(&mut self, item: String) {
    for i in 0..self.hash_fns {
      let index: usize = zoomies::modulo(&item, i.try_into().unwrap(), self.bits.len());
      self.bits.set(index, true);
    }
  }

  /// Query the filter for an address
  /// ```ts
  /// const bloomFilter = new Zoomies(100, 0.01);
  /// bloomFilter.insertAddress('0x1234');
  /// bloomFilter.queryAddress('0x1234'); // true
  /// bloomFilter.queryAddress('0x5678'); // false
  /// ```
  #[napi]
  pub fn query_address(&self, item: String) -> bool {
    for i in 0..self.hash_fns {
      let index: usize = zoomies::modulo(&item, i.try_into().unwrap(), self.bits.len());

      if !self.bits.get(index).unwrap() {
        return false;
      }
    }
    true
  }

  #[napi]
  pub fn extract_compiled_filter(&self) -> Buffer {
    // Get the length of the BitVec
    let length = self.bits.len();

    let mut i = 0;

    let mut bit_filter = Vec::<u8>::new();

    while i < length {
      if *self.bits.get(i).unwrap() {
        bit_filter.push(0b1);
      } else {
        bit_filter.push(0b0);
      }

      i = i + 1;
    }

    Buffer::from(bit_filter)
  }

  #[napi]
  pub fn get_hash_fns(&self) -> u32 {
    self.hash_fns
  }
}
