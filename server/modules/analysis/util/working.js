/*
db.socialmedia.aggregate([
// unwind ngrams.1
    {$unwind: {path: '$ngrams.1.sorted', includeArrayIndex: 'index1', preserveNullAndEmptyArrays: true}},
    {$project: {
        data: [{
            "gramSize": "$ngrams.1.gramSize",
            "gramCount": "$ngrams.1.gramCount",
            "word": "$ngrams.1.sorted.word",
            "wordCount": "$ngrams.1.sorted.count"
        }],
        ngrams: {$cond: {if: {$eq: ['$index1', 0]}, then: '$ngrams', else: {$literal: {'2': {sorted: [{word: null, count: 0}]}}}}},
        index1: true
    }},
    // unwind ngrams.2
    {$unwind: {path: '$ngrams.2.sorted', includeArrayIndex: 'index2', preserveNullAndEmptyArrays: true}},
    {$project: {
        data: {$cond: {if: {$or: [{$eq: ['$index2', 0]}, {$eq: ['$index2', null]}]}, then: {$concatArrays: ['$data', [{
            "gramSize": "$ngrams.2.gramSize",
            "gramCount": "$ngrams.2.gramCount",
            "word": "$ngrams.2.sorted.word",
            "wordCount": "$ngrams.2.sorted.count"
        }]]}, else: [{
            "gramSize": "$ngrams.2.gramSize",
            "gramCount": "$ngrams.2.gramCount",
            "word": "$ngrams.2.sorted.word",
            "wordCount": "$ngrams.2.sorted.count"
        }]}},
        ngrams: {$cond: {if: {$eq: ['$index2', 0]}, then: '$ngrams', else: {$literal: {'3': {sorted: [{word: null, count: 0}]}}}}},
        index1: true,
        index2: true
    }},
    // unwind ngrams.3
    {$unwind: {path: '$ngrams.3.sorted', includeArrayIndex: 'index3', preserveNullAndEmptyArrays: true}},
    {$project: {
        data: {$cond: {if: {$or: [{$eq: ['$index3', 0]}, {$eq: ['$index3', null]}]}, then: {$concatArrays: ['$data', [{
            "gramSize": "$ngrams.3.gramSize",
            "gramCount": "$ngrams.3.gramCount",
            "word": "$ngrams.3.sorted.word",
            "wordCount": "$ngrams.3.sorted.count"
        }]]}, else: [{
            "gramSize": "$ngrams.3.gramSize",
            "gramCount": "$ngrams.3.gramCount",
            "word": "$ngrams.3.sorted.word",
            "wordCount": "$ngrams.3.sorted.count"
        }]}},
        ngrams: {$cond: {if: {$eq: ['$index3', 0]}, then: '$ngrams', else: {$literal: {'4': {sorted: [{word: null, count: 0}]}}}}},
        index1: true,
        index2: true,
        index3: true
    }},
    {$unwind: {path: '$data'}},
    {$sort: {'data.gramSize': 1}},
    {$group: {_id: '$data.word', count: {$sum: 1}}},
    {$sort: {count: -1}}
    //{$project: {data: true, index1: true, index2: true, index3: true}}
])
*/
