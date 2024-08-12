import { ExtractJwt, Strategy } from 'passport-jwt'
import usersModel from "./db/usersModel";

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || ''
};

const jwtAuth = new Strategy(jwtOptions, (payload, done) => {
  usersModel.findOne({ _id: payload.id })
    .then(user => {
      if (user) {
        done(null, user);
      } else {
        done(null, false);
      }
    })
    .catch(err => {
      done(err, false);
    });
});

export default jwtAuth
