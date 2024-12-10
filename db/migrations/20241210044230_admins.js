/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex)
{
    return knex.schema.createTable("admins", (table) =>
    {
        table.increments("id").primary();
        table.string("name").notNullable();
        table.string("username").notNullable();
        table.string("email").notNullable();
        table.string("password").notNullable();
        table.timestamps();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex)
{
    return knex.schema.dropTableIfExists("admins")
};
