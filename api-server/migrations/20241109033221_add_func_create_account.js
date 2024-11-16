/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = async function(knex) {
    await knex.raw(`
        create table role(
            id bigserial primary key,
            name text,
            note text
        );

        insert into role (name, note) values
            ('admin', 'Quản trị hệ thống'),
            ('employee', 'Nhân viên'),
            ('manager', 'Quản lý'),
            ('customer', 'Khách hàng');

        create schema private;
        
        create table private.authentication(
            id bigint generated by default as identity primary key,
            username text,
            password_hash text,
            rolename text
        );

        create extension if not exists pgcrypto;

        alter default privileges revoke execute on functions from public;
        
        create type Result as (
            success boolean,
            error_code int,
            message text,
            data jsonb
        );

        create function public.create_account(
            username text, password text, rolename text
        ) returns Result as $$
        declare
            newUser private.authentication;
        begin
            select auth.* into newUser
            from private.authentication as auth
            where auth.username = $1;

            if found then
                return (false, 1, 'Cannot create: Username already exists.', '{}')::Result;
            else
                insert into private.authentication (username, password_hash, rolename) values
                    ($1, crypt($2, gen_salt('bf')), $3);
                return (true, 0, '', concat('{"username":"', username, '"}') )::Result;
            end if;
        end;
        $$ language plpgsql strict security definer;
    `);
};

exports.down = async function(knex) {
    await knex.raw(`
    `);
};