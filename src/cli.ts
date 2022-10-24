#!/usr/bin/env node

import { Command } from 'commander'
import { oraPromise } from 'ora'
import pino from 'pino'
import pretty from 'pino-pretty'

import sitemapCheck from './index'
const program = new Command()
const stream = pretty({
  colorize: true,
  singleLine: true,
  crlf: true,
})
const logger = pino({ level: 'info' }, stream)

program
  .name('sitemap-url-check')
  .version('1.0.0')
  .argument('<sitemap-url>', 'sitemap url')
  .action((sitemapUrl) => {
    oraPromise(sitemapCheck(sitemapUrl).then(({ invalid }) => {
      if (invalid.length > 0) {
        logger.error('We found problems withing these URLs')
        return Promise.reject(invalid)
      }
    })).catch(console.log)
  })
  .parse()

