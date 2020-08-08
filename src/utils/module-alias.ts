import * as paths from 'path';
import moduleAlias from 'module-alias';

const files = paths.resolve(__dirname, '../..');

moduleAlias.addAliases({
  '@src': paths.join(files, 'src'),
  '@test': paths.join(files, 'test'),
});
