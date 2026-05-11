const FtpDeploy = require("ftp-deploy");

const FTP_BASE = {
  user: "open@jsbb-fukuoka.com",
  password: "Dory1124",
  host: "sv13316.xserver.jp",
  port: 21,
  forcePasv: true,
  sftp: false,
};

// ① WPプラグイン
async function deployPlugin() {
  const ftp = new FtpDeploy();
  ftp.on("uploading", (d) =>
    console.log(`[Plugin ${d.transferredFileCount}/${d.totalFilesCount}] ${d.filename}`)
  );
  await ftp.deploy({
    ...FTP_BASE,
    localRoot: __dirname + "/wordpress-plugin/jsbb-custom",
    remoteRoot: "/home/jsbbfukuoka/wp.jsbb-fukuoka.com/public_html/wp-content/plugins/jsbb-custom/",
    include: ["*", "**/*"],
    exclude: [],
    deleteRemote: false,
  });
  console.log("✅ WP Plugin deploy finished!");
}

// ② CMSページ (wp.jsbb-fukuoka.com/open/)
async function deployCms() {
  const ftp = new FtpDeploy();
  ftp.on("uploading", (d) =>
    console.log(`[CMS ${d.transferredFileCount}/${d.totalFilesCount}] ${d.filename}`)
  );
  await ftp.deploy({
    ...FTP_BASE,
    localRoot: __dirname + "/open-cms",
    remoteRoot: "/home/jsbbfukuoka/wp.jsbb-fukuoka.com/public_html/open/",
    include: ["*", "**/*"],
    exclude: [],
    deleteRemote: false,
  });
  console.log("✅ CMS page deploy finished!");
}

(async () => {
  try {
    await deployPlugin();
    await deployCms();
  } catch (err) {
    console.error("Deploy error:", err);
    process.exit(1);
  }
})();
