router.post("/firebase-login", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  try {
    // 1) Firebase token doğrula
    const decoded = await firebaseAdmin.auth().verifyIdToken(token);

    const { uid, email, name, picture } = decoded;

    // 2) Kullanıcı DB'de var mı?
    let user = await db.user.findUnique({ where: { firebaseUid: uid }});

    if (!user) {
      // 3) Yeni kullanıcı oluştur
      user = await db.user.create({
        data: {
          firebaseUid: uid,
          email,
          username: name || email.split("@")[0], 
          provider: "google",
        }
      });
    }

    // 4) SECRETSTEPS için JWT oluştur
    const jwtToken = createJwt(user.id);

    res.json({ jwt: jwtToken, user });

  } catch (err) {
    res.status(401).json({ error: "Invalid Firebase token" });
  }
});
