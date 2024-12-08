import { parseArgs } from 'jsr:@std/cli/parse-args';
import { generateSecret, generateToken, encrypt, decrypt } from './index.ts';

const flags = parseArgs(Deno.args, {
  boolean: ['help', 'gensecret', 'gentoken', 'decrypt'],
  string: ['secret', 'token', 'password'],
  default: { token: '', password: '' },
});
const { secret, token, password } = flags;

if (flags.help) {
  console.log('Usage: deno run main.ts --secret=SECRET < INPUT');
  console.log('help');
  Deno.exit(0);
}

if (flags.gensecret) {
  console.log(generateSecret());
  Deno.exit(0);
}

if (flags.gentoken) {
  console.log(generateToken());
  Deno.exit(0);
}

if (!secret) {
  console.error('Usage: deno run main.ts --secret=SECRET < INPUT');
  Deno.exit(1);
}

if (flags.decrypt) {
  await decrypt(Deno.stdin.readable, { secret, token, password })
    .pipeTo(Deno.stdout.writable);
} else {
  await encrypt(Deno.stdin.readable, { secret, token, password })
    .pipeTo(Deno.stdout.writable);
}
