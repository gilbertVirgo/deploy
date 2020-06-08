const flags = require("node-flag");
const SSH = require("simple-ssh");
const { promises: fs } = require("fs");
const path = require("path");
const untildify = require("untildify");

const log = async (message) => {
	const logFile = path.join(__dirname, "log");
	await fs.appendFile(logFile, message + "\r\n");
};

const init = async () => {
	const privateKeyDefault = await fs.readFile(untildify("~/.ssh/id_rsa"));

	const {
		h: host,
		u: user,
		k: key = privateKeyDefault,
		r: repo,
	} = flags.getAll();

	await log(`Connecting to ${user}@${host}...`);

	const conn = new SSH({
		host,
		user,
		key,
	});

	await log(`Connected successfully`);

	// e.g git@github.com:gilbertVirgo/deploy.git
	const repoName = repo.split("/").slice(-1)[0].split(".")[0];

	await log(`Cloning repo onto the server...`);

	conn.on("error", console.error.bind(console));

	conn.exec(
		`cd /var/www/ && git clone ${repo} && cd ${repoName} && bash ./build.sh`, // git clone ${repo} && cd ${repoName} && bash ./build.sh
		{
			out: console.log.bind(console),
		}
	).start();

	await log(`No failures`);
};

if (flags.isset("h") && flags.isset("u") && flags.isset("r")) {
	init();
} else {
	throw new Error("I need at least host, user and repo!");
}
