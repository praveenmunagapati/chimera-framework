'use strict'

const monk = require('monk')
const util = require('./util.js')

module.exports = {
  'db': getManager,
  'collection': getCollection
}

function getCompleteDbOption (dbOption) {
  let completeOption = {
    'user': util.getStretchedString('0', 24, '0'),
    'excludeDeleted': true,
    'showHistory': false
  }
  if (util.isRealObject(dbOption)) {
    for (let key in completeOption) {
      if (key in dbOption) {
        completeOption[key] = dbOption[key]
      }
    }
  }
  return completeOption
}

function getCompleteInsertData (data, dbOption) {
  if (util.isArray(data)) {
    for (let value of data) {
      value = getCompleteInsertData(value, dbOption)
    }
    return data
  }
  data._muser = dbOption.user
  data._mtime = String(Date.now())
  data._deleted = 0
  let historyData = util.getDeepCopiedObject(data)
  data._history = [{'set': historyData}]
  return data
}

function getCompleteUpdateData (data, dbOption) {
  let completeData = {
    '$set': {},
    '$push': {}
  }
  for (let key in data) {
    if (key.indexOf('$') === 0) {
      completeData[key] = data[key]
    } else {
      completeData.$set[key] = data[key]
    }
  }
  completeData.$set._muser = dbOption.user
  completeData.$set._mtime = String(Date.now())
  let historyData = {}
  for (let key in completeData) {
    let strippedKey = key.replace(/^\$(.*)$/g, '$1')
    historyData[strippedKey] = util.getDeepCopiedObject(completeData[key])
  }
  completeData.$push._history = historyData
  // console.error(completeData)
  return completeData
}

function getCompleteQuery (query, dbOption) {
  if (!dbOption.excludeDeleted) {
    return query
  }
  let filterQuery = {'_deleted': 0}
  if (util.isRealObject(query)) {
    return {'$and': [filterQuery, query]}
  }
  return filterQuery
}

function getCompleteOptions (options, dbOption) {
  if (dbOption.showHistory) {
    return options
  }
  let filterOptions = {'_history': 0}
  if (util.isRealObject(options)) {
    return Object.assign({}, options, filterOptions)
  }
  return filterOptions
}

function getCompleteStages (stages, dbOption) {
  if (!dbOption.excludeDeleted) {
    return stages
  }
  let filterStage = {'$match': {'_deleted': 0}}
  if (util.isArray(stages)) {
    let completeStages = util.getDeepCopiedObject(stages)
    completeStages.unshift(filterStage)
    return completeStages
  }
  return [filterStage]
}

function getAggregationResult (res) {
  if (res.length === 1 && '_id' in res[0] && res[0]._id === '_aggregate' && '_result' in res[0]) {
    res = res[0]._result
  } else if (res.length >= 1 && '_id' in res[0] && '_result' in res[0]) {
    let newRes = {}
    for (let i = 0; i < res.length; i++) {
      newRes[res[i]._id] = res[i]._result
    }
    res = newRes
  }
  return res
}

function getManagerWithMiddleware (db, dbOption) {
  db.addMiddleware(context => next => (args, method) => {
    if (method === 'insert' && 'data' in args) {
      args.data = getCompleteInsertData(args.data, dbOption)
    }
    if (method === 'update' && 'update' in args) {
      args.update = getCompleteUpdateData(args.update, dbOption)
    }
    if ('query' in args) {
      args.query = getCompleteQuery(args.query, dbOption)
    }
    if (method === 'find' && 'options' in args) {
      args.options = getCompleteOptions(args.options, dbOption)
    }
    if (method === 'aggregate' && 'stages' in args) {
      args.stages = getCompleteStages(args.stages, dbOption)
    }
    return next(args, method).then((res) => {
      if (method === 'aggregate' && util.isArray(res)) {
        res = getAggregationResult(res)
      }
      return res
    })
  })
  return db
}

function getManager (url, dbOption) {
  dbOption = getCompleteDbOption(dbOption)
  let db = util.isString(url) ? monk(url) : url
  db._collectionOptions.middlewares = util.getDeepCopiedObject(db._collectionOptions.middlewares)
  db = getManagerWithMiddleware(db, dbOption)
  return db
}

function getCollectionWithSoftRemove (collection) {
  collection.softRemove = (query, opts, fn) => {
    let update = {'_deleted': 1}
    return collection.update(query, update, opts, fn)
  }
  return collection
}

function getSimpleAggregateParam (field, filter, groupBy, fn) {
  let defaultGroupBy = '_aggregate'
  let defaultFilter = {}
  if (util.isFunction(filter)) {
    fn = filter
    filter = defaultFilter
    groupBy = defaultGroupBy
  } else if (util.isFunction(groupBy)) {
    fn = groupBy
    groupBy = defaultGroupBy
  } else {
    groupBy = '$' + groupBy
  }
  return {field, filter, groupBy, fn}
}

function getCollectionWithSimpleAggregate (collection) {
  // min
  collection.min = (field, filter, groupBy, fn) => {
    ({field, filter, groupBy, fn} = getSimpleAggregateParam(field, filter, groupBy, fn))
    let pipeline = [{'$match': filter}, {'$group': {'_id': groupBy, '_result': {'$min': '$' + field}}}]
    return collection.aggregate(pipeline, fn)
  }
  // max
  collection.max = (field, filter, groupBy, fn) => {
    ({field, filter, groupBy, fn} = getSimpleAggregateParam(field, filter, groupBy, fn))
    let pipeline = [{'$match': filter}, {'$group': {'_id': groupBy, '_result': {'$max': '$' + field}}}]
    return collection.aggregate(pipeline, fn)
  }
  // avg
  collection.avg = (field, filter, groupBy, fn) => {
    ({field, filter, groupBy, fn} = getSimpleAggregateParam(field, filter, groupBy, fn))
    let pipeline = [{'$match': filter}, {'$group': {'_id': groupBy, '_result': {'$avg': '$' + field}}}]
    return collection.aggregate(pipeline, fn)
  }
  // sum
  collection.sum = (field, filter, groupBy, fn) => {
    ({field, filter, groupBy, fn} = getSimpleAggregateParam(field, filter, groupBy, fn))
    let pipeline = [{'$match': filter}, {'$group': {'_id': groupBy, '_result': {'$sum': '$' + field}}}]
    return collection.aggregate(pipeline, fn)
  }
  return collection
}

function getCollection (db, name, options) {
  let collection = db.get(name, options)
  collection = getCollectionWithSoftRemove(collection)
  collection = getCollectionWithSimpleAggregate(collection)
  return collection
}
