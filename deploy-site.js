const FtpDeploy = require("ftp-deploy");
const ftpDeploy = new FtpDeploy();

const config = {
  user: "open@jsbb-fukuoka.com",
  password: "Dory1124",
  host: "sv13316.xserver.jp",
  port: 21,
  localRoot: __dirname + "/out",
  remoteRoot: "/jsbb-fukuoka.com/public_html/",
  include: ["*", "**/*"],
  // WordPressのファイル・ディレクトリを除外（上書き防止）
  exclude: [
    "wp-admin/**",
    "wp-content/**",
    "wp-includes/**",
    "wp-*.php",
    "xmlrpc.php",
    "license.txt",
    "readme.html",
    ".user.ini",
    "app/**",
    "css/**",
    "lib/**",
    "theme/**",
    "kurume/**",
    "xmailinglist/**",
    "BK_kurume.zip",
  ],
  deleteRemote: false,
  forcePasv: true,
  sftp: false,
};

ftpDeploy
  .deploy(config)
  .then((res) => {
    console.log("✓ Static site uploaded successfully!");
    console.log(`Uploaded ${res.length} files`);
  })
  .catch((err) => {
    console.error("Upload error:", err);
    process.exit(1);
  });

ftpDeploy.on("uploading", (data) => {
  console.log(`[${data.transferredFileCount}/${data.totalFilesCount}] ${data.filename}`);
});
