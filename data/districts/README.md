# Districts

This data module handles configuration, creation, and updating for the 'districts' mongodb collection.

A 'district' doc represents a school district. It looks something like this:

    {
      _id: ObjectId("1234"),
      cdsId: 1234,
      ncesId: 1234,
      name: "Bogus Elementary",
      website: ObjectId("1234"),
      facebookSeed: ObjectId("1234"),
      twitterSeed: ObjectId("1234"),
      street: "13735 Ager-Beswick Road",
      city: "montague",
      zip: "96064-9434",
      county: "siskiyou",
      state: "ca",
      latitude: 41.938994,
      longitude: -122.35352,
      studentCount: 9,
      lepCount: 0,
      iepCount: 0,
      frlCount: 6,
      modified: ISODate("2015-10-08T07:00:00Z")
    }

See `server/models/district.js` for more details.

### Usage
* The raw data is contained in `districts.csv`, which is pulled from the [CA Districts](https://docs.google.com/a/prevagroup.com/spreadsheets/d/1LepgwVzFVxK7JUvBMex_Fu_-u7TFA6bJi2yuqV1-84E/edit?usp=sharing) spreadsheet.
* The data in `districts.csv` is converted to JSON and saved in `districts.json` by the `districts.convert.js` script.
  * From the `data/districts` directory, run `node data.convert`.
* The districts can be added to your local database or the production database via the `districts.create` script.
  * From the `data/districts` directory, run `node data.create local` or `node data.create production`.