migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!users.fields.getByName('can_view_global_dashboard')) {
      users.fields.add(
        new BoolField({
          name: 'can_view_global_dashboard',
          required: false,
        }),
      )
    }

    app.save(users)

    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'johnnyoliveira@gmail.com')
      admin.set('can_view_global_dashboard', true)
      app.save(admin)
    } catch (_) {}
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (users.fields.getByName('can_view_global_dashboard')) {
      users.fields.removeByName('can_view_global_dashboard')
    }
    app.save(users)
  },
)
