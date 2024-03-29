import branch, { BranchEvent, BranchParams } from "react-native-branch";
import { secureStoreGetItem } from "../../store/secure-storage";
import Purchases from "react-native-purchases";
import safeLogError from "../../util/error";

export async function initBranch(navigation = null) {
  const storedUid = await secureStoreGetItem("uid");
  branch.setIdentity(storedUid);
  // const { campaign, channel, feature, tags, stage, url } =
  //   await showBranchParams();
  // Listener
  branch.subscribe({
    onOpenStart: () => {
      //{ uri, cachedInitialEvent }) => {
      // console.log(
      //   "subscribe onOpenStart, will open " +
      //     uri +
      //     " cachedInitialEvent is " +
      //     cachedInitialEvent
      // );
      // console.log(
      //   "onOpenStart",
      //   "will open " + uri + " cachedInitialEvent is " + cachedInitialEvent
      // );
    },
    onOpenComplete: ({ error, params }) => {
      // error, params, uri }) => {
      if (error) {
        safeLogError("Branch error", error);
        return;
      } else if (params) {
        if (!params["+clicked_branch_link"]) {
          if (params["+non_branch_link"]) {
            // console.log("non_branch_link: " + uri);
            // Route based on non-Branch links
            return;
          }
        } else {
          // Handle params
          const deepLinkPath = params.$deeplink_path as string;
          // const canonicalUrl = params.$canonical_url as string;
          // console.log("deepLinkPath", deepLinkPath);
          // console.log("canonicalUrl", canonicalUrl);
          // Route based on Branch link data
          if (deepLinkPath && deepLinkPath.split("/")[0] === "join")
            navigation?.navigate("Join", { id: deepLinkPath.split("/")[1] });
          return;
        }
      }
    },
  });
}

export async function showBranchParams() {
  const latestParams: BranchParams = await branch.getLatestReferringParams(); // Params from last open
  // const installParams = await branch.getFirstReferringParams(); // Params from original install
  const campaign = latestParams["~campaign"];
  const channel = latestParams["~channel"];
  const feature = latestParams["~feature"];
  const tags = latestParams["~tags"];
  const stage = latestParams["~stage"];
  const url = latestParams["+url"];
  await Purchases.setCampaign(campaign);
  await Purchases.setAttributes({
    channel,
    feature,
    stage,
    url,
  });
  return { campaign, channel, feature, tags, stage, url };
}

export async function trackPurchaseEvent() {
  // console.log("trackPurchaseEvent ~ trackPurchaseEvent:");
  // branch tracking
  const buo = await branch.createBranchUniversalObject("item/12345", {
    canonicalUrl: "https://branch.io/item/12345",
    title: "My Item Title",
    contentMetadata: {
      quantity: 1,
      price: 23.2,
      sku: "1994320302",
      productName: "my_product_name1",
      productBrand: "my_prod_Brand1",
      customMetadata: {
        custom_key1: "custom_value1",
        custom_key2: "custom_value2",
      },
    },
  });

  const params = {
    transaction_id: "tras_Id_1232343434",
    currency: "USD",
    revenue: 180.2,
    shipping: 10.5,
    tax: 13.5,
    coupon: "promo-1234",
    affiliation: "high_fi",
    description: "Preferred purchase",
    purchase_loc: "Palo Alto",
    store_pickup: "unavailable",
    customData: {
      Custom_Event_Property_Key1: "Custom_Event_Property_val1",
      Custom_Event_Property_Key2: "Custom_Event_Property_val2",
    },
  };
  // const referrer = await branch.getLatestReferringParams();
  // let referrerString = "";
  // if (referrer) {
  //   referrerString = referrer["~channel"];
  // }
  const event = new BranchEvent(BranchEvent.Purchase, [buo], params);
  event.logEvent();
  // console.log("event logged, refferrer:", referrerString);

  // console.log("trackPurchaseEvent ~ trackPurchaseEvent: end");
}
