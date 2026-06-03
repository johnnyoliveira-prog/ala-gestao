migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          values: ['admin', 'gestor', 'consultor'],
          maxSelect: 1,
          required: false,
        }),
      )
    }

    users.listRule = "id = @request.auth.id || @request.auth.role = 'admin'"
    users.viewRule = "id = @request.auth.id || @request.auth.role = 'admin'"
    users.updateRule = "id = @request.auth.id || @request.auth.role = 'admin'"

    app.save(users)

    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'johnnyoliveira@gmail.com')
      admin.set('role', 'admin')
      app.save(admin)
    } catch (_) {}
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (users.fields.getByName('role')) {
      users.fields.removeByName('role')
    }
    users.listRule = 'id = @request.auth.id'
    users.viewRule = 'id = @request.auth.id'
    users.updateRule = 'id = @request.auth.id'
    app.save(users)
  },
)
