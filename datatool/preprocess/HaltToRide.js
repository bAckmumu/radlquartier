/**
 * HaltToRide
 *
 */

const DataParserJson = require('./../share/DataParserJson');
const helper = require('./../share/helper');
const Ride = require('./../share/ride');

class HaltToRide extends DataParserJson {
  constructor(outputFolder, tempFileName, dataFileName, provider) {
    super(outputFolder, tempFileName, dataFileName, provider);
  }

  processData(filename, json) {
    if (!json) {
      throw new Error('processData, json:', json);
    }

    const halts = [...helper.PairsToMap(json).values()];

    let bikesHalts = new Map();
    for (const halt of halts) {
      if (bikesHalts.has(halt.bikeNumber)) {
        let tempHalts = bikesHalts.get(halt.bikeNumber);
        tempHalts.push(halt);
        bikesHalts.set(halt.bikeNumber, tempHalts);
      } else {
        bikesHalts.set(halt.bikeNumber, [halt]);
      }
    }

    let zeroCount = 0;
    let distanceCount = 0;
    let durationCount = 0;
    let rideCount = 0;
    for (const bikeHalts of bikesHalts.values()) {
      // console.log('bikeHalts',bikeHalts);

      // const tempHalts = [...bikeHalts.values()];

      // filter 0,0 coordinates
      const halts = bikeHalts.filter(function(halt) {
        if (halt.longitude !== 0 && halt.longitude !== 0) {
          return true;
        }

        zeroCount += 1;
        return false;
      });

      halts.sort(function(a, b) {
        return new Date(a.startDate) - new Date(b.startDate);
      });

      for (let index = 0; index < halts.length; index++) {
        if (index + 1 === halts.length) {
          continue;
        }

        const start = halts[index];
        const end = halts[index + 1];

        const ride = new Ride(
          start.bikeNumber,
          start.id,
          end.id,
          start.longitude,
          start.latitude,
          end.longitude,
          end.latitude,
          start.endDate,
          end.startDate,
          start.provider
        );

        // filter rides with no distance or negative duration
        // not quite sure where negative duration comes from
        if (ride.distance === 0) {
          distanceCount += 1;
          continue;
        }
        if (ride.duration < 0) {
          // console.log('ride.duration', ride.duration);
          durationCount += 1;
          continue;
        }

        rideCount += 1;
        this.outputData.set(ride.id, ride);
      }
    }
    console.log('zeroCount', zeroCount);
    console.log('distanceCount', distanceCount);
    console.log('durationCount', durationCount);
    console.log('rideCount', rideCount);
  }
}

module.exports = HaltToRide;
