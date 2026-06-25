1.expo: expo-camera support barcode scan.
2.folder structure -> `api layer, features (auth, loyalty, scan),components, navigation, lib (queryClient, storage)`.
3.api: 1 instance, 2 interceptros
token read from zustand w secure storage
endpoints.ts like `bounties(), redeemCoupon()`
initalizing `LoginResponse, CustomerRelationship, Bounty, RedeemResponse` as we alr have
4.state:
zustand + securestore = auth token, user identity (dont store points)
tanstack query = caching, refetch, invalidation.
5.screen+navigation:
rootnavigator (auth check)
-present = dashboard (home, rewards, scan)
-not, = loginscreen

```
Homescree (points bal. + profile info)l
RewardsScreen (bounty list, redeem buttons)
ScanScreen (camera QR -> redeem coupon)


```

##### EXECUTION PHASE

2. Given prompt - got setup w state, auth & api

`storage.ts` - secure store wrapper, single key constant.

`types.ts` - responses are structured for token & acces token.

`endpoints.ts` - client id, all endpoints.

`authStore.ts` - w zustand, actions: `setToken, setUser, clearAuth, hyderate` hyderate checks if user logged in.
note: `token and user are intentionally separated: login returns no user info, so user stays null until slice 2 loads the CR/profile.`.

`client.ts` - apiClient w baseurl, interceptors: `request, response`
request uses `useAuthStore.getState().token` & response gives response, handle error to throw message & clearAuth();

`useLogin.ts` - instance `setToken` from `useAuthStore`, `useMutation` from tanstack - react query & login user with apiClient along `endpoint`. return `data` & `setToken` from `data.token`

3. Next prompt given - got query setup + login screen + navigation with auth gate

Installed react navigation & deps.

`queryClient.ts` - query client set to one retry instead default of 3 tanstack & `refetchOnWindowFocus: false` as TanStack defaults to true as of web concept

`App.tsx` as soon as app renders - hydrate is called in useEffect
it initalizes to check if hyderated is true/false - if false rootnavigator is contioned to null or even until secure store returns it.

`RootNavigator.tsx`
hydrated = false -> blank
hydrated = true & token = null -> login
hydrated = true & token present -> home

Login screen kept outside stack navigatiion so no navigating back after logged in. Token missing = logout & also No navigate, no flash, no back-button bug.

`LoginScreen.tsx` login screen with `useLogin()` call error points to shape of ApiError
isPending shows spinner

`HomeScreen.tsx` - for now, shows text logged in & a button to logout which pressed calls clearAuth

4. Prompt given - got home screen with live points and profile

`usePoints.ts`,`useProfile.ts` usePoints accept `cr` queryKey for CustomerRelationship object

Components - `button, card, errorview` for UI

`HomeScreen.tsx` - shows loading from query points/profile w activity indicator & when loaded - everything renders.

If error fallback to ErrorView.

If data, shows point card, profile card, CTA (to be done) & logout

5. rewards list + reward redemption
given prompt, got the actual screens with queries - `study` claude to understand in detail.
read em too if needed:
<!--

````


MUST READ PROCESS FURTHER - IT HEAD MAJOR ERRORS


a fix commit also was done


```-->


6.scan modal + coupon redemption.


button on home navigates to scan screen with fallback to manual entry.


Coupon redeem: setQueryData then invalidate & balance jumps


scannedRef = useRef(false) — a ref, not state, so it doesn't trigger re-renders.


handleBarcodeScan checks three conditions before firing: if (scannedRef.current || isPending || isSuccess) return.


<!-- read process for more -->


<!-- ----------------------- -->


<!-- in last -->


#### HERO POINT TO WRITE IN DOC -


Tests — beyond maybe one or two. A token-injection interceptor test or a balance-sync reducer test shows you can test; a full suite in a 6h window steals from the area that's actually graded. Document this explicitly: "Wrote one interceptor test to demonstrate approach; prioritized state-sync correctness over coverage given the budget." That sentence earns more than 40% coverage would.


<!-- ----------------------- -->


....
why tanstack?
Bottom line: because the whole app is server state, and the one hard problem in this challenge — keeping the points balance correct after you redeem — is something TanStack Query solves in a line.


....
why?
me: queryClient (retry 1 not default 3, refetchOnWindowFocus off — RN has
no window focus concept


<!-- ----------------------- -->
````
