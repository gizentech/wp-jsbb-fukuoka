const FtpDeploy = require("ftp-deploy");
const ftpDeploy = new FtpDeploy();

const config = {
  user: "open@jsbb-fukuoka.com",
  password: "Dory1124",
  host: "sv13316.xserver.jp",
  port: 21,
  localRoot: __dirname + "/wordpress-plugin/jsbb-custom",
  remoteRoot: "/home/jsbbfukuoka/jsbb-fukuoka.com/public_html/wp-content/plugins/jsbb-custom/",
  include: ["*", "**/*"],
  exclude: [],
  deleteRemote: false,
  forcePasv: true,
  sftp: false,
};

ftpDeploy
  .deploy(config)
  .then((res) => {
    console.log("✓ jsbb-custom plugin uploaded successfully!");
    console.log(`Uploaded ${res.length} files`);
  })
  .catch((err) => {
    console.error("Upload error:", err);
    process.exit(1);
  });

ftpDeploy.on("uploading", (data) => {
  console.log(`[${data.transferredFileCount}/${data.totalFilesCount}] ${data.filename}`);
});
