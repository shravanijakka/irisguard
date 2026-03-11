import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Iter "mo:core/Iter";

actor {
  type UserId = Nat;

  type UserData = {
    id : UserId;
    username : Text;
    passwordHash : Text;
    irisTemplate : Text;
    registeredAt : Int;
  };

  type AuthResult = {
    #success;
    #invalidCredentials;
    #userNotFound;
    #irisMismatch;
    #internalError;
  };

  type AuthToken = UserId;

  let users = Map.empty<UserId, UserData>();
  let usernameToIdMap = Map.empty<Text, UserId>();
  var nextUserId = 1;
  let authenticatedTokens = Map.empty<UserId, ()>();

  public shared ({ caller }) func register(username : Text, passwordHash : Text, irisTemplate : Text) : async AuthResult {
    if (usernameToIdMap.containsKey(username)) {
      return #invalidCredentials;
    };

    let id = nextUserId;
    nextUserId += 1;
    let newUser : UserData = {
      id;
      username;
      passwordHash;
      irisTemplate;
      registeredAt = Time.now();
    };

    users.add(id, newUser);
    usernameToIdMap.add(username, id);

    #success;
  };

  public shared ({ caller }) func login(username : Text, passwordHash : Text, irisTemplate : Text) : async {
    result : AuthResult;
    token : ?AuthToken;
  } {
    switch (usernameToIdMap.get(username)) {
      case (null) { return { result = #userNotFound; token = null } };
      case (?userId) {
        let user = switch (users.get(userId)) {
          case (null) { return { result = #userNotFound; token = null } };
          case (?user) { user };
        };

        if (user.passwordHash != passwordHash) {
          return { result = #invalidCredentials; token = null };
        };

        if (user.irisTemplate != irisTemplate) {
          return { result = #irisMismatch; token = null };
        };

        authenticatedTokens.add(userId, ());
        { result = #success; token = ?userId };
      };
    };
  };

  public query ({ caller }) func getProfile(token : AuthToken) : async UserData {
    if (not authenticatedTokens.containsKey(token)) {
      Runtime.trap("Invalid or expired token");
    };

    switch (users.get(token)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) { user };
    };
  };

  public query ({ caller }) func getAllUsernames() : async [Text] {
    usernameToIdMap.keys().toArray();
  };

  public query ({ caller }) func isUsernameAvailable(username : Text) : async Bool {
    not usernameToIdMap.containsKey(username);
  };

  module UserData {
    public func compareByRegisteredAt(a : UserData, b : UserData) : { #less; #equal; #greater } {
      Int.compare(a.registeredAt, b.registeredAt);
    };
  };

  public query ({ caller }) func getAllUsers() : async [UserData] {
    users.toArray().map(func((_, user)) { user }).sort(UserData.compareByRegisteredAt);
  };

  public query ({ caller }) func getOldestUser() : async UserData {
    switch (users.entries().next()) {
      case (null) { Runtime.trap("No users registered") };
      case (?(id, _)) {
        switch (users.get(id)) {
          case (null) { Runtime.trap("User not found") };
          case (?user) { user };
        };
      };
    };
  };
};
