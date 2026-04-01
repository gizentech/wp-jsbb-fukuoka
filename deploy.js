const FtpDeploy = require("ftp-deploy");
const ftpDeploy = new FtpDeploy();

const config = {
  user: "open@jsbb-fukuoka.com",
  password: "Dory1124",
  host: "sv13316.xserver.jp",
  port: 21,
  localRoot: __dirname + "/out",
  remoteRoot: "/home/jsbbfukuoka/jsbb-fukuoka.com/public_html/",
  include: ["*", "**/*", ".*"],
  exclude: [],
  deleteRemote: false,
  forcePasv: true,
  sftp: false,
};

ftpDeploy
  .deploy(config)
  .then((res) => {
    console.log("Deploy finished! Uploaded files:", res.length || "all");
  })
  .catch((err) => {
    console.error("Deploy error:", err);
    process.exit(1);
  });

ftpDeploy.on("uploading", (data) => {
  console.log(`[${data.transferredFileCount}/${data.totalFilesCount}] ${data.filename}`);
});
