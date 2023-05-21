import test from 'ava'

import { Zoomies } from '../index.js'

test("when querying an address that has not been added to the filter it should return false", (t) => {
  const address = '0x7efc1624745261c7C5331548D33514a471D9cC1C';
  

  const zoomies = new Zoomies(10000000, 0.01);
  const exists = zoomies.queryAddress(address);

  t.is(exists, false)
});

test("when querying an address that has been added to the filter it should return true", (t) => {
  const address = '0x7efc1624745261c7C5331548D33514a471D9cC1C';

  const zoomies = new Zoomies(10000000, 0.01);
  zoomies.insertAddress(address);

  const exists = zoomies.queryAddress(address);
  t.is(exists, true)
});
