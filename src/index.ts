import { PromisePool } from '@supercharge/promise-pool'
import { $fetch } from 'ohmyfetch'
import parser from 'xml2js'
import z from 'zod'

const xmlUrlDecoder = z.object({
  urlset: z.object({
    url: z.array(
      z.object({
        loc: z.array(z.string().url()),
      }),
    ),
  }),
})

function sitemapCheck(url: string) {
  return $fetch(url, { parseResponse: txt => txt })
    .then(parser.parseStringPromise)
    .then(xmlUrlDecoder.parseAsync)
    .then((result) => {
      const urls = result.urlset.url.map(({ loc }) => loc).flat()

      return PromisePool.withConcurrency(10)
        .for(urls)
        .process(
          (url: string): Promise<{ url: string; valid: boolean }> => $fetch(url, { parseResponse: txt => txt })
            .then(() => ({ url, valid: true }))
            .catch(() => Promise.resolve({ url, valid: false })),
        )
        .then(({ results }) =>
          results.reduce(
            (acc, curr) => ({
              valid: [...acc.valid, ...(curr.valid ? [curr.url] : [])],
              invalid: [...acc.invalid, ...(!curr.valid ? [curr.url] : [])],
            }),
            { valid: Array<string>(), invalid: Array<string>() },
          ),
        )
    })
}

export default sitemapCheck
