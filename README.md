# leetcode-profile-crawler

A crawler to collect Leetcode user profile data. It use [Playwright](https://playwright.dev/) to run a true Chrome browser to crawl the data so that it can bypass the anti-crawler mechanism of Leetcode.

## Installation

1. Make sure you have Chrome installed.
1. Make sure you have Node.js version 18 or greater installed. You can verify this by running `node -v` in the terminal.
1. Run `corepack enable` in the terminal.
1. Clone this repository and run `pnpm install` in the terminal.

## Usage

Create a file named `.env` in the root directory of this repository. This file should contain the following content:

```
LEETCODE_USERNAME=your_leetcode_username
LEETCODE_PASSWORD=your_leetcode_password
LEETCODE_USER_ID_LIST=cuiaoxiang,pandaforever,lxhgww,Yawn_Sean,zrts
```

Run `pnpm start` in the terminal. This command will open a Chrome window and start crawling. 

The crawling speed is limited by Leetcode, so it may take some time to crawl all the users. During my test, it took about 10 minutes to crawl 100 users.

The crawled data will be saved in the `data` directory. The data is saved in JSON format shown below. You can use this data for further analysis.

```JSON
{
  "cuiaoxiang": [
    {
      "id": "432453052",
      "title": "Checking Existence of Edge Length Limited Paths",
      "titleSlug": "checking-existence-of-edge-length-limited-paths",
      "timestamp": "1608432761"
    },
    {
      "id": "432450070",
      "title": "Jump Game VI",
      "titleSlug": "jump-game-vi",
      "timestamp": "1608432431"
    }
    ...
  ],
  "pandaforever": [
    {
      "id": "1086470841",
      "title": "Maximum Points After Collecting Coins From All Nodes",
      "titleSlug": "maximum-points-after-collecting-coins-from-all-nodes",
      "timestamp": "1698547603"
    },
    {
      "id": "1086463665",
      "title": "Minimum Increment Operations to Make Array Beautiful",
      "titleSlug": "minimum-increment-operations-to-make-array-beautiful",
      "timestamp": "1698547170"
    }
    ...
  ]
  ...
}
```


## License

MIT
