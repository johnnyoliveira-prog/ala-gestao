migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.add(
      new JSONField({
        name: 'allowed_companies',
        required: false,
        maxSize: 2000000,
      }),
    )
    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.fields.removeByName('allowed_companies')
    app.save(users)
  },
)
