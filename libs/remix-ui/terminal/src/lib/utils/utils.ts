
export const getKeyOf = (item) => {
  return Object.keys(item)[0]
}

export const getValueOf = (item) => {
  return Object.values(item)[0]
}

export const Objectfilter = (obj: any, filterValue: any) =>
  obj.filter((item: any) => Object.keys(item)[0].indexOf(filterValue) > -1)

export const matched = (arr, value) => arr.map(x => Object.keys(x).some(x => x.startsWith(value))).some(x => x === true)

const findDeep = (object, fn, found = { break: false, value: undefined }) => {
  if (typeof object !== 'object' || object === null) return
  for (var i in object) {
    if (found.break) break
    var el = object[i]
    if (el && el.innerText !== undefined && el.innerText !== null) el = el.innerText
    if (fn(el, i, object)) {
      found.value = el
      found.break = true
      break
    } else {
      findDeep(el, fn, found)
    }
  }
  return found.value
}

export const find = (args, query) => {
  query = query.trim()
  var isMatch = !!findDeep(args, function check (value) {
    if (value === undefined || value === null) return false
    if (typeof value === 'function') return false
    if (typeof value === 'object') return false
    var contains = String(value).indexOf(query.trim()) !== -1
    return contains
  })
  return isMatch
}
