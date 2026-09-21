import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sourceUrl = (relativePath) => new URL(`../src/${relativePath}`, import.meta.url);

async function readSource(relativePath) {
  return readFile(sourceUrl(relativePath), 'utf8');
}

test('as telas de autenticação usam a integração central da API', async () => {
  const loginPage = await readSource('pages/LoginPage.jsx');
  const signUpPage = await readSource('pages/SignUpPage.jsx');

  assert.doesNotMatch(loginPage, /localhost:3001/);
  assert.doesNotMatch(signUpPage, /localhost:3001/);
  assert.match(loginPage, /useAuth/);
  assert.match(signUpPage, /useAuth/);
});

test('o frontend usa somente a chave token para a sessão', async () => {
  const loginPage = await readSource('pages/LoginPage.jsx');
  const authContext = await readSource('context/AuthContext.jsx');
  const axiosClient = await readSource('api/axiosClient.js');
  const combinedSource = `${loginPage}\n${authContext}\n${axiosClient}`;

  assert.doesNotMatch(combinedSource, /techub_token|techub_user/);
  assert.match(authContext, /localStorage\.setItem\(['"]token['"]/);
  assert.match(axiosClient, /localStorage\.getItem\(['"]token['"]/);
});
