/* i love typescript */

import HelloResolver from "./hello";
import SessionResolver from "./session";
import UserResolver from "./user";
import ActivityResolver from "./activity";
import GroupResolver from "./group";
import SessionSubscriptionResolver from "./sessionSubscription";

const _ALL = {
    HelloResolver,
    UserResolver,
    SessionResolver,
    ActivityResolver,
    SessionSubscriptionResolver,
    GroupResolver,
};

export const ALL = Object.values(_ALL);

export default { ..._ALL, ALL };
