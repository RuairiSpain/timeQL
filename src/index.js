const { GraphQLServer, PubSub } = require('graphql-yoga');

const pubsub = new PubSub();
const TIME_CHANGED_TOPIC = 'TIME_CHANGED';

const typeDefs = `
type Query {
    message: String!,
    startTime: String!
}

type Timed {
    time: Int!
    elapsedTime: String
    active: Boolean
    preview: Boolean
    finished: Boolean
}

type Subscription {
    timed: Timed!
}
`

const addMinutes = (time, minutes) => new Date(time + minutes * 60 * 1000);
const startTime = new Date(new Date().setHours(21)); //21:00 hours
const elapsedTime = () =>  startTime - new Date();
const endTime = addMinutes(startTime, 20);
endTime.setMinutes(startTime.getMinutes() + 20);
const previewTime = 5 * 60 * 1000; // 5 minutes


const resolvers = {
  Query: {
    message: () => `Hello, starts at ${startTime.getTime()}`,
    startTime: () => {
        const today = startTime
        return today.toJSON();
    }
  },
  Timed: {
    elapsedTime: timed => timed.time < 0 ? `Starts at : ${timed.time}` : `Elapsed time : ${timed.time}`,
    active: timed => timed.time > startTime && timed.time < endTime,
    preview: timed => timed.time > previewTime && timed.time < startTime,
    finished: timed => timed.time > endTime,
  },
  Subscription: {
    timed: {
        subscribe: (parent, args, { pubsub }) => {
            const channel = Math.random().toString(36).substring(2, 15) // random channel name
            // Collate current app state
            setInterval(() => pubsub.publish(channel, { timed: { time: elapsedTime() } }), 1000);
            return pubsub.asyncIterator(channel);
          },
    },
  }
}

// 3
const server = new GraphQLServer({
  typeDefs,
  resolvers,
  context: { pubsub },
})
server.start(() => console.log(`Server is running on http://localhost:4000`))