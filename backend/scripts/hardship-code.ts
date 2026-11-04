import 'dotenv/config';
import { createHardshipCode } from '../src/lib/hardship-code';

const count = Math.max(1, Number(process.argv[2]) || 1);
for (let i = 0; i < count; i++) console.log(createHardshipCode());
