import { Zoomies } from '../index.js';
import { performance } from 'node:perf_hooks';
import chalk from 'chalk';
import Table from 'cli-table';
import { randomBytes } from 'node:crypto';
import BloomFilter from 'bloom-filters';

const ONE_HUNDRED_THOUSAND = 100000;
const ONE_MILLION = 1000000;

const addressArray = [...Array(ONE_HUNDRED_THOUSAND)].map(_ => '0x' + randomBytes(32).toString('hex'));

const zoomies = new Zoomies(ONE_MILLION, 0.01);

console.log(`\n${chalk.bold.red('Starting benchmark...')}\n`);

// Insert Addresses Benchmark
const insertAddressStart = performance.now();
for (let i = 0; i < ONE_HUNDRED_THOUSAND; i++) {
	zoomies.insertAddress(addressArray[i]);
}
const insertAddressEnd = performance.now();

const insertAddressTotal = insertAddressEnd - insertAddressStart;
const insertAddressPerOperation = insertAddressTotal / ONE_HUNDRED_THOUSAND;

// Query Addresses Benchmark
const queryAddressStart = performance.now();

const results = [];
for (let i = 0; i < ONE_HUNDRED_THOUSAND; i++) {
	results.push(zoomies.queryAddress(addressArray[i]));
}
const queryAddressEnd = performance.now();

const queryAddressTotal = queryAddressEnd - queryAddressStart;
const queryAddressPerOperation = queryAddressTotal / ONE_HUNDRED_THOUSAND;

console.log(new Set(results).size === 1 ? chalk.bold.green('All addresses were found in the filter') : chalk.bold.red('Not all addresses were found in the filter, something went wrong...'));

const randomAddress = '0x' + randomBytes(32).toString('hex');
const isRandomAddressInFilter = zoomies.queryAddress(randomAddress);

console.log(isRandomAddressInFilter ? chalk.bold.red('Generated a new address, it was found in the filter... this might be a false positive or the code is broken. Please run the test again') : chalk.bold.green('Generated a new address, it was not found in the filter... this is good!'));


// Bloom Filter Benchmark
const bloomFilter = BloomFilter.BloomFilter.create(ONE_MILLION, 0.01);

const bloomFilterInsertStart = performance.now();
for (let i = 0; i < ONE_HUNDRED_THOUSAND; i++) {
	bloomFilter.add(addressArray[i]);
}
const bloomFilterInsertEnd = performance.now();

const bloomFilterInsertTotal = bloomFilterInsertEnd - bloomFilterInsertStart;
const bloomFilterInsertPerOperation = bloomFilterInsertTotal / ONE_HUNDRED_THOUSAND;

const bloomFilterQueryStart = performance.now();
for (let i = 0; i < ONE_HUNDRED_THOUSAND; i++) {
	bloomFilter.has(addressArray[i]);
}
const bloomFilterQueryEnd = performance.now();

const bloomFilterQueryTotal = bloomFilterQueryEnd - bloomFilterQueryStart;
const bloomFilterQueryPerOperation = bloomFilterQueryTotal / ONE_HUNDRED_THOUSAND;

const table = new Table({
	head: [
		chalk.bold('Benchmark'), 
		chalk.bold('Per Operation (ns)'), 
		chalk.bold('Per Operation (µs)'), 
		chalk.bold('Total (ms)')
	],
});

console.log('');

table.push([chalk.bold('Zoomies (Rust + N-API) - Insert Benchmark'), chalk.green(insertAddressPerOperation * 1e+6), chalk.green(insertAddressPerOperation * 1000), chalk.green(insertAddressTotal)]);
table.push([chalk.bold('Zoomies (Rust + N-API) - Query Benchmark'), chalk.green(queryAddressPerOperation * 1e+6), chalk.green(queryAddressPerOperation * 1000), chalk.green(queryAddressTotal)]);
table.push([chalk.bold('Bloom Filter (JavaScript) - Insert Benchmark'), chalk.red(bloomFilterInsertPerOperation * 1e+6), chalk.red(bloomFilterInsertPerOperation * 1000), chalk.red(bloomFilterInsertTotal)]);
table.push([chalk.bold('Bloom Filter (JavaScript) - Query Benchmark'), chalk.red(bloomFilterQueryPerOperation * 1e+6), chalk.red(bloomFilterQueryPerOperation * 1000), chalk.red(bloomFilterQueryTotal)]);

console.log(table.toString());

console.log(`\n${chalk.bold.red('Benchmark complete!')}\n`);

const extractedFilter = zoomies.extractCompiledFilter();
const extractedFilterSize = extractedFilter.byteLength;
const hashFns = zoomies.getHashFns();

console.log(`\n${chalk.bold.red('Filter size:')} ${extractedFilterSize} bits`);
console.log(`\n${chalk.bold.red('Hash functions:')} ${hashFns}`);


const newZoomies = Zoomies.newFromCompiledFilter(extractedFilter, hashFns);

const checkRandomExisitingAddress = newZoomies.queryAddress(addressArray[3708]);
console.log(checkRandomExisitingAddress ? chalk.bold.green('Exisiting Address is found in filter!') : chalk.bold.red('Exisiting address was not found in filter, something went wrong...'));

const checkRandomNonExisitingAddress = newZoomies.queryAddress(randomAddress);
console.log(checkRandomNonExisitingAddress ? chalk.bold.red('Generated a new address, it was found in the filter... this might be a false positive or the code is broken. Please run the test again') : chalk.bold.green('Generated a new address, it was not found in the filter... this is good!'));