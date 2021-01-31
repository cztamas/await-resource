#!/usr/bin/env node
'use strict';

const yargs = require('yargs');
const checkResources = require('../src/index.js');

const args = yargs
  .array('pg')
  .array('mysql')
  .array('rabbit')
  .array('redis')
  .array('mongo')
  .array('firestore')
  .array('url')
  .array('healthcheck')
  .number('timeout')
  .number('interval')
  .argv;

checkResources(args);
