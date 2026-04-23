migrate(
  (app) => {
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'johnnyoliveira@gmail.com')
      admin.set('allowed_companies', [
        'CR Hotel Boutique',
        'CR Vinícola',
        'CR Condomínio',
        'Fleme',
        'Madri',
        'Linving Mall',
        'Reserva dos Inconfidentes',
        'Eco Resort',
      ])
      app.save(admin)
    } catch (_) {
      // Ignore if user does not exist
    }
  },
  (app) => {
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'johnnyoliveira@gmail.com')
      admin.set('allowed_companies', null)
      app.save(admin)
    } catch (_) {
      // Ignore
    }
  },
)
