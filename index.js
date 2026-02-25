// index.js
const { distance } = require("fastest-levenshtein");

// Known commands + their valid subcommands
const COMMAND_MAP = {
  git: ["push", "pull", "commit", "checkout", "branch", "merge", "rebase",
        "status", "log", "diff", "fetch", "clone", "init", "add", "reset",
        "stash", "tag", "remote"],
  npm: ["install", "run", "start", "test", "build", "publish", "update"],
  docker: ["run", "build", "pull", "push", "ps", "stop", "rm", "images"],
  systemctl: ["start", "stop", "restart", "status", "enable", "disable"],
};

const ALL_COMMANDS = Object.keys(COMMAND_MAP);

function findClosest(input, candidates, threshold = 3) {
  let best = null;
  let bestDist = Infinity;

  for (const candidate of candidates) {
    const d = distance(input, candidate);
    if (d < bestDist) {
      bestDist = d;
      best = candidate;
    }
  }

  return bestDist <= threshold ? { match: best, distance: bestDist } : null;
}

function suggestCorrection(args) {
  const [inputCmd, ...rest] = args;

  // Case 1: top-level command typo (e.g., "gi" instead of "git")
  const cmdMatch = findClosest(inputCmd, ALL_COMMANDS);
  if (cmdMatch) {
    const correctedCmd = cmdMatch.match;
    const subCmds = COMMAND_MAP[correctedCmd] || [];

    // Case 2: also check subcommand typo
    if (rest.length > 0) {
      const subMatch = findClosest(rest[0], subCmds);
      if (subMatch) {
        const correctedSub = subMatch.match;
        const fullCorrected = [correctedCmd, correctedSub, ...rest.slice(1)].join(" ");
        console.log(`Did you mean: \x1b[33m${fullCorrected}\x1b[0m ?`);
        process.exit(2); // exit code 2 = suggest correction
      }
    }

    const fullCorrected = [correctedCmd, ...rest].join(" ");
    console.log(`Did you mean: \x1b[33m${fullCorrected}\x1b[0m ?`);
    process.exit(2);
  }

  // Case 3: command is fine, but subcommand is wrong (e.g., "git psh")
  if (COMMAND_MAP[inputCmd] && rest.length > 0) {
    const subMatch = findClosest(rest[0], COMMAND_MAP[inputCmd]);
    if (subMatch) {
      const fullCorrected = [inputCmd, subMatch.match, ...rest.slice(1)].join(" ");
      console.log(`Did you mean: \x1b[33m${fullCorrected}\x1b[0m ?`);
      process.exit(2);
    }
  }

  process.exit(0);
}

suggestCorrection(process.argv.slice(2));