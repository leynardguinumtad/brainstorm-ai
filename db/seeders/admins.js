/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function (knex)
{
  // Deletes ALL existing entries
  await knex('admins').del()
  await knex('admins').insert([
    { id: 1, name: 'admin admin', username: "root", email: "root@gmail.com", password: "123" },
    { id: 2, name: 'admin admin admin', username: "user", email: "user@gmail.com", password: "123" },
  ]);
};
