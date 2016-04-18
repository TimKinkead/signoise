'use strict';

var ccKeywords = [
        'common core',
        'common core standards',
        'common core state standards',
        'common core english',
        'common core math',
        'common core science',
        'state standards',
        'content standards',
        'core standards',
        'curriculum standards',
        'ccss',
        'california standards',
        'california state standards',
        'california common core',
        '#commoncore',
        '#ccss',
        '#stopcommoncore'
    ],
    edKeywords = ccKeywords.concat([
        'education',
        'teacher', 'teachers',
        'student', 'students',
        'school', 'schools', 
        'school district', 'school districts',
        'classroom', 'classroom'
    ]);

module.exports = [
    {name: 'common core', keywords: ccKeywords},
    {name: 'education', keywords: edKeywords}
];