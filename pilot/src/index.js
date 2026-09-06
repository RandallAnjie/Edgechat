import { EchoRoom } from "./echo-room.js";
import { handleRequest } from "./handlers.js";

export { EchoRoom };

export default {
	async fetch(request, env) {
		return handleRequest(request, env);
	},
};
