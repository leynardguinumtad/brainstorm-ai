/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex)
{
    return knex.schema.createTableIfNotExists("brainstorm3s", (table) =>
    {
        table.increments("id").primary();
        table.integer("user_id").unsigned().notNullable();
        table.string("lab_name").notNullable();
        table.text("note").nullable();
        table.json("nodes").nullable();
        table.json("links").nullable();
        table.text("ai_text").nullable();
        table.string("image_path").nullable();
        table.timestamp("created_at").defaultTo(knex.fn.now());

        //connects this table to the users table
        table.foreign("user_id").references("id").inTable("users").onDelete("CASCADE");
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex)
{
    return knex.schema.dropTableIfExists("brainstorm3s");
};
