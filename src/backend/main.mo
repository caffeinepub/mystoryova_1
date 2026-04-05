import Time "mo:core/Time";
import List "mo:core/List";
import Text "mo:core/Text";
import Char "mo:core/Char";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import IC "ic:aaaaa-aa";

import OutCall "http-outcalls/outcall";

import MixinStorage "blob-storage/Mixin";



actor {
  include MixinStorage();

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Helper Functions
  func naturalOrderCompare(a : Text, b : Text) : Order.Order {
    if (a == b) { return #equal };
    let aIter = a.chars();
    let bIter = b.chars();

    loop {
      switch (aIter.next(), bIter.next()) {
        case (null, null) { return #equal };
        case (null, ?_) { return #less };
        case (?_, null) { return #greater };
        case (?aChar, ?bChar) {
          if (aChar != bChar) { return Char.compare(aChar, bChar) };
        };
      };
    };
  };

  func stringCompare(a : ?Text, b : ?Text) : Order.Order {
    switch (a, b) {
      case (null, null) { #equal };
      case (null, ?_) { #less };
      case (?_, null) { #greater };
      case (?aVal, ?bVal) { naturalOrderCompare(aVal, bVal) };
    };
  };

  func getCustomerAddressFromMap(id : Text) : CustomerAddress {
    switch (customerAddresses.get(id)) {
      case (null) { Runtime.trap("Customer address with id " # id # " not found") };
      case (?address) { address };
    }
  };

  // Data Types
  type BookFormat = { #kindle : Text; #paperback : Text };

  type Book = {
    id : Text;
    title : Text;
    description : Text;
    genre : Text;
    coverImageUrl : Text;
    formats : [BookFormat];
    audiobookLink : ?Text;
    featured : Bool;
  };

  type BlogPost = {
    id : Text;
    title : Text;
    category : Text;
    content : Text;
    excerpt : Text;
    coverImageUrl : Text;
    publishedAt : Int;
  };

  type Review = {
    bookId : Text;
    reviewerName : Text;
    email : Text;
    rating : Nat;
    comment : Text;
  };

  type OrderItem = {
    productId : Text;
    name : Text;
    quantity : Nat;
    price : Nat;
    currency : Text;
  };

  type Coupon = {
    code : Text;
    discountType : Text;
    discountValue : Nat;
    maxUsages : Nat;
    usageCount : Nat;
    expiryDate : Int;
    isActive : Bool;
    currency : Text;
  };

  type Audiobook = {
    id : Text;
    name : Text;
    description : Text;
    priceINR : Nat;
    priceUSD : Nat;
    duration : Text;
    narrator : Text;
    coverEmoji : Text;
    razorpayUrlINR : Text;
    razorpayUrlUSD : Text;
    isActive : Bool;
  };

  type MerchItem = {
    id : Text;
    name : Text;
    description : Text;
    priceINR : Nat;
    priceUSD : Nat;
    category : Text;
    coverEmoji : Text;
    razorpayUrl : Text;
    isActive : Bool;
    qikinkProductId : Text;
  };

  type Setting = {
    key : Text;
    value : Text;
  };

  type CustomerAccount = {
    id : Text;
    name : Text;
    email : Text;
    passwordHash : Text;
    createdAt : Int;
  };

  type CustomerAddress = {
    id : Text;
    customerId : Text;
    addressLabel : Text;
    fullName : Text;
    phone : Text;
    line1 : Text;
    line2 : Text;
    city : Text;
    state : Text;
    pincode : Text;
    country : Text;
    isDefault : Bool;
  };

  type ShippingAddress = {
    fullName : Text;
    phone : Text;
    line1 : Text;
    line2 : Text;
    city : Text;
    state : Text;
    pincode : Text;
    country : Text;
  };

  type Order = {
    id : Text;
    customerId : ?Text;
    customerName : Text;
    customerEmail : Text;
    customerPhone : Text;
    shippingAddress : ?ShippingAddress;
    items : [OrderItem];
    totalAmount : Nat;
    currency : Text;
    status : Text;
    createdAt : Int;
    razorpayPaymentId : Text;
    notes : Text;
    qikinkOrderId : Text;
    fulfillmentStatus : Text;
  };

  // Persistent Data Structures
  let books = Map.empty<Text, Book>();
  let blogPosts = Map.empty<Text, BlogPost>();
  let reviews = Map.empty<Text, List.List<Review>>();
  var subscribers = List.empty<Text>();
  var authorBio = "O. Chiddarwar is a passionate author...";

  let orders = Map.empty<Text, Order>();
  let coupons = Map.empty<Text, Coupon>();
  let audiobooks = Map.empty<Text, Audiobook>();
  let merchItems = Map.empty<Text, MerchItem>();
  let settings = Map.empty<Text, Setting>();
  let customerAccounts = Map.empty<Text, CustomerAccount>();
  let customerAddresses = Map.empty<Text, CustomerAddress>();

  // Book Management
  func upsertBook(key : Text, value : Book) {
    books.remove(key);
    books.add(key, value);
  };

  func upsertBlogPost(key : Text, value : BlogPost) {
    blogPosts.remove(key);
    blogPosts.add(key, value);
  };

  func upsertReviews(key : Text, value : List.List<Review>) {
    reviews.remove(key);
    reviews.add(key, value);
  };

  func upsertOrder(key : Text, value : Order) {
    orders.remove(key);
    orders.add(key, value);
  };

  func upsertCoupon(key : Text, value : Coupon) {
    coupons.remove(key);
    coupons.add(key, value);
  };

  func upsertAudiobook(key : Text, value : Audiobook) {
    audiobooks.remove(key);
    audiobooks.add(key, value);
  };

  func upsertMerchItem(key : Text, value : MerchItem) {
    merchItems.remove(key);
    merchItems.add(key, value);
  };

  func upsertSetting(key : Text, value : Setting) {
    settings.remove(key);
    settings.add(key, value);
  };

  func upsertCustomerAccount(key : Text, value : CustomerAccount) {
    customerAccounts.remove(key);
    customerAccounts.add(key, value);
  };

  func upsertCustomerAddress(key : Text, value : CustomerAddress) {
    customerAddresses.remove(key);
    customerAddresses.add(key, value);
  };

  public query func getBooks() : async [Book] {
    books.values().toArray();
  };

  public query func getBook(id : Text) : async Book {
    switch (books.get(id)) {
      case (null) { Runtime.trap("Book not found") };
      case (?book) { book };
    };
  };

  public shared ({ caller }) func addBook(book : Book) : async () {
    upsertBook(book.id, book);
  };

  public shared ({ caller }) func updateBook(book : Book) : async () {
    upsertBook(book.id, book);
  };

  public shared ({ caller }) func deleteBook(id : Text) : async () {
    books.remove(id);
  };

  // Blog Management
  public query func getBlogPosts() : async [BlogPost] {
    blogPosts.values().toArray();
  };

  public query func getBlogPost(id : Text) : async BlogPost {
    switch (blogPosts.get(id)) {
      case (null) { Runtime.trap("Post not found") };
      case (?post) { post };
    };
  };

  public shared ({ caller }) func addBlogPost(post : BlogPost) : async () {
    upsertBlogPost(post.id, post);
  };

  public shared ({ caller }) func updateBlogPost(post : BlogPost) : async () {
    upsertBlogPost(post.id, post);
  };

  public shared ({ caller }) func deleteBlogPost(id : Text) : async () {
    blogPosts.remove(id);
  };

  // Newsletter Subscribers
  public shared ({ caller }) func addSubscriber(email : Text) : async () {
    if (subscribers.contains(email)) {
      Runtime.trap("This email is already subscribed.");
    };
    subscribers.add(email);
  };

  public shared ({ caller }) func removeSubscriber(email : Text) : async () {
    let filtered = List.empty<Text>();
    for (sub in subscribers.values()) {
      if (sub != email) { filtered.add(sub) };
    };
    subscribers.clear();
    for (sub in filtered.values()) {
      subscribers.add(sub);
    };
  };

  public query ({ caller }) func getSubscribers() : async [Text] {
    subscribers.toArray();
  };

  // Author Bio
  public shared ({ caller }) func updateAuthorBio(bio : Text) : async () {
    authorBio := bio;
  };

  public query func getAuthorBio() : async Text {
    authorBio;
  };

  // Book Reviews
  public shared ({ caller }) func addReview(review : Review) : async () {
    let existingReviews = switch (reviews.get(review.bookId)) {
      case (null) { List.empty<Review>() };
      case (?list) { list };
    };
    existingReviews.add(review);
    upsertReviews(review.bookId, existingReviews);
  };

  public query func getReviews(bookId : Text) : async [Review] {
    switch (reviews.get(bookId)) {
      case (null) { [] };
      case (?list) { list.toArray() };
    };
  };

  // Order Management
  public shared ({ caller }) func createOrder(order : Order) : async () {
    upsertOrder(order.id, order);
  };

  public query func getOrders() : async [Order] {
    orders.values().toArray();
  };

  public query func getOrder(id : Text) : async ?Order {
    orders.get(id);
  };

  public shared ({ caller }) func updateOrderStatus(id : Text, status : Text) : async () {
    let order = switch (orders.get(id)) {
      case (null) { Runtime.trap("Order not found") };
      case (?o) { o };
    };
    let updatedOrder = { order with status };
    upsertOrder(id, updatedOrder);
  };

  public shared ({ caller }) func deleteOrder(id : Text) : async () {
    orders.remove(id);
  };

  // Coupon Codes
  public shared ({ caller }) func createCoupon(coupon : Coupon) : async () {
    upsertCoupon(coupon.code, coupon);
  };

  public query func getCoupons() : async [Coupon] {
    coupons.values().toArray();
  };

  public query func getCoupon(code : Text) : async ?Coupon {
    coupons.get(code);
  };

  public shared ({ caller }) func deleteCoupon(code : Text) : async () {
    coupons.remove(code);
  };

  public shared ({ caller }) func incrementCouponUsage(code : Text) : async () {
    let coupon = switch (coupons.get(code)) {
      case (null) { Runtime.trap("Coupon not found") };
      case (?c) { c };
    };
    let updatedCoupon = {
      coupon with
      usageCount = coupon.usageCount + 1;
    };
    upsertCoupon(code, updatedCoupon);
  };

  public query func validateCoupon(code : Text) : async ?Coupon {
    switch (coupons.get(code)) {
      case (null) { null };
      case (?coupon) {
        if (not coupon.isActive) { return null };
        if (coupon.expiryDate < Time.now()) { return null };
        if (coupon.usageCount >= coupon.maxUsages) { return null };
        ?coupon;
      };
    };
  };

  // Audiobook Management
  public shared ({ caller }) func createAudiobook(audiobook : Audiobook) : async () {
    upsertAudiobook(audiobook.id, audiobook);
  };

  public query func getAudiobooks() : async [Audiobook] {
    audiobooks.values().toArray();
  };

  public query func getAudiobook(id : Text) : async ?Audiobook {
    audiobooks.get(id);
  };

  public shared ({ caller }) func updateAudiobook(audiobook : Audiobook) : async () {
    upsertAudiobook(audiobook.id, audiobook);
  };

  public shared ({ caller }) func deleteAudiobook(id : Text) : async () {
    audiobooks.remove(id);
  };

  // Merch Management
  public shared ({ caller }) func createMerchItem(merchItem : MerchItem) : async () {
    upsertMerchItem(merchItem.id, merchItem);
  };

  public query func getMerchItems() : async [MerchItem] {
    merchItems.values().toArray();
  };

  public query func getMerchItem(id : Text) : async ?MerchItem {
    merchItems.get(id);
  };

  public shared ({ caller }) func updateMerchItem(merchItem : MerchItem) : async () {
    upsertMerchItem(merchItem.id, merchItem);
  };

  public shared ({ caller }) func deleteMerchItem(id : Text) : async () {
    merchItems.remove(id);
  };

  // Site Settings
  public query func getSetting(key : Text) : async ?Setting {
    settings.get(key);
  };

  public shared ({ caller }) func updateSetting(setting : Setting) : async () {
    upsertSetting(setting.key, setting);
  };

  public query func getAllSettings() : async [Setting] {
    settings.values().toArray();
  };

  // Customer Account Management
  public shared ({ caller }) func registerCustomer(name : Text, email : Text, passwordHash : Text) : async ?Text {
    // Check if email already exists (case-insensitive)
    let lowerEmail = email.toLower();

    switch (customerAccounts.values().find(func(a) { a.email.toLower() == lowerEmail })) {
      case (?_) { null };
      case (null) {
        let id = email.concat(name);
        let account : CustomerAccount = {
          id;
          name;
          email;
          passwordHash;
          createdAt = Time.now();
        };
        upsertCustomerAccount(id, account);
        ?id;
      };
    };
  };

  public shared ({ caller }) func loginCustomer(email : Text, passwordHash : Text) : async ?CustomerAccount {
    let lowerEmail = email.toLower();
    customerAccounts.values().find(
      func(a) { a.email.toLower() == lowerEmail and a.passwordHash == passwordHash }
    );
  };

  public query func getCustomer(id : Text) : async ?CustomerAccount {
    customerAccounts.get(id);
  };

  public shared ({ caller }) func updateCustomer(account : CustomerAccount) : async () {
    let existingAccount = switch (customerAccounts.get(account.id)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?acc) { acc };
    };
    let updatedAccount = {
      existingAccount with name = account.name;
    };
    upsertCustomerAccount(account.id, updatedAccount);
  };

  public shared ({ caller }) func changeCustomerPassword(id : Text, oldHash : Text, newHash : Text) : async Bool {
    let existingAccount = switch (customerAccounts.get(id)) {
      case (null) { return false };
      case (?acc) { acc };
    };
    if (existingAccount.passwordHash != oldHash) { return false };
    let updatedAccount = {
      existingAccount with passwordHash = newHash;
    };
    upsertCustomerAccount(id, updatedAccount);
    true;
  };

  // Customer Address Management
  public shared ({ caller }) func addCustomerAddress(address : CustomerAddress) : async () {
    upsertCustomerAddress(address.id, address);
  };

  public query func getCustomerAddresses(customerId : Text) : async [CustomerAddress] {
    let allAddresses = customerAddresses.values().toArray();
    let filteredAddresses = allAddresses.filter(
      func(addr) {
        addr.customerId == customerId;
      }
    );
    filteredAddresses.sort(
      func(a, b) { naturalOrderCompare(a.addressLabel, b.addressLabel) }
    );
  };

  public shared ({ caller }) func updateCustomerAddress(address : CustomerAddress) : async () {
    ignore getCustomerAddressFromMap(address.id);
    upsertCustomerAddress(address.id, address);
  };

  public shared ({ caller }) func deleteCustomerAddress(id : Text) : async () {
    ignore getCustomerAddressFromMap(id);
    customerAddresses.remove(id);
  };

  public shared ({ caller }) func setDefaultAddress(customerId : Text, addressId : Text) : async () {
    let addresses = customerAddresses.toArray();
    let filteredAddresses = addresses.filter(
      func((_, addr)) { addr.customerId == customerId }
    );
    for ((addrId, addr) in filteredAddresses.values()) {
      let newIsDefault = addr.id == addressId;
      let updatedAddress = {
        addr with
        isDefault = newIsDefault;
      };
      customerAddresses.remove(addrId);
      customerAddresses.add(addrId, updatedAddress);
    };
  };

  // Qikink Print-on-Demand Integration
  public query func getQikinkCatalog() : async Text {
    switch (settings.get("qikink_catalog_cache")) {
      case (null) { "" };
      case (?setting) { setting.value };
    };
  };

  public shared ({ caller }) func syncQikinkCatalog() : async Text {
    let apiKey = switch (settings.get("qikink_api_key")) {
      case (null) { return "Qikink API key not configured" };
      case (?setting) { setting.value };
    };

    let url = "https://api.qikink.com/api/catalog";
    let headers = [ { name = "Authorization"; value = "Bearer " # apiKey } ];

    let responsePromise = OutCall.httpGetRequest(url, headers, transform);
    let response = await responsePromise;
    upsertSetting("qikink_catalog_cache", { key = "qikink_catalog_cache"; value = response });
    "Catalog synced successfully";
  };

  public shared ({ caller }) func updateOrderFulfillment(id : Text, qikinkOrderId : Text, fulfillmentStatus : Text) : async () {
    let order = switch (orders.get(id)) {
      case (null) { Runtime.trap("Order not found") };
      case (?o) { o };
    };
    let updatedOrder = {
      order with
      qikinkOrderId;
      fulfillmentStatus;
    };
    upsertOrder(id, updatedOrder);
  };
  // Qikink Order Fulfillment
  public shared ({ caller }) func fulfillOrderViaQikink(orderId : Text) : async Text {
    // Check if Qikink is enabled
    switch (settings.get("qikink_enabled")) {
      case (null) { return "Qikink integration is not enabled" };
      case (?s) {
        if (s.value != "true") { return "Qikink integration is disabled" };
      };
    };

    // Get API key
    let apiKey = switch (settings.get("qikink_api_key")) {
      case (null) { return "Qikink API key not configured" };
      case (?s) { s.value };
    };

    // Get order
    let order = switch (orders.get(orderId)) {
      case (null) { return "Order not found: " # orderId };
      case (?o) { o };
    };

    // Build line items JSON array
    var itemsJson = "[";
    var firstItem = true;
    for (item in order.items.vals()) {
      if (not firstItem) { itemsJson #= "," };
      firstItem := false;
      let qikinkId = switch (merchItems.get(item.productId)) {
        case (null) { item.productId };
        case (?m) {
          if (m.qikinkProductId != "") { m.qikinkProductId } else { item.productId }
        };
      };
      let qty = item.quantity;
      itemsJson #= "{\"product_id\":\"" # qikinkId # "\",\"quantity\":" # debug_show(qty) # "}";
    };
    itemsJson #= "]";

    // Build shipping address JSON
    let shippingJson = switch (order.shippingAddress) {
      case (null) {
        "{\"name\":\"" # order.customerName #
        "\",\"email\":\"" # order.customerEmail #
        "\",\"phone\":\"" # order.customerPhone #
        "\",\"address1\":\"\",\"city\":\"\",\"state\":\"\",\"pincode\":\"\",\"country\":\"IN\"}"
      };
      case (?addr) {
        "{\"name\":\"" # addr.fullName #
        "\",\"email\":\"" # order.customerEmail #
        "\",\"phone\":\"" # addr.phone #
        "\",\"address1\":\"" # addr.line1 #
        "\",\"address2\":\"" # addr.line2 #
        "\",\"city\":\"" # addr.city #
        "\",\"state\":\"" # addr.state #
        "\",\"pincode\":\"" # addr.pincode #
        "\",\"country\":\"" # addr.country # "\"}"
      };
    };

    let payload =
      "{\"reference_id\":\"" # order.id #
      "\",\"shipping_address\":" # shippingJson #
      ",\"line_items\":" # itemsJson # "}";

    let url = "https://api.qikink.com/api/orders";
    let headers = [
      { name = "Authorization"; value = "Bearer " # apiKey },
      { name = "Content-Type"; value = "application/json" },
    ];

    let response = await OutCall.httpPostRequest(url, headers, payload, transform);

    // Update order with Qikink response data
    let updatedOrder = {
      order with
      qikinkOrderId = response;
      fulfillmentStatus = "Sent to Qikink";
      status = "Processing";
    };
    upsertOrder(orderId, updatedOrder);

    response
  };

};