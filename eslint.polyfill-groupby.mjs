// eslint-flat-config-utils вызывает Object.groupBy (ES2024); на Node 20 yarn может подхватить другой node без API.
if (typeof Object.groupBy !== 'function') {
  Object.defineProperty(Object, 'groupBy', {
    configurable: true,
    writable: true,
    value(items, callbackfn) {
      const out = Object.create(null)
      let i = 0
      for (const element of items) {
        const key = callbackfn(element, i++)
        const bucket = out[key]
        if (bucket)
          bucket.push(element)
        else
          out[key] = [element]
      }
      return out
    },
  })
}
