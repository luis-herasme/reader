import { Route, Switch } from "wouter";
import Home from "./home";
import Reader from "./reader";
import Login from "./login";
import { Custom } from "./custom";

export function Router() {
  return (
    <Switch>
      <Route path="custom">
        <Custom />
      </Route>
      <Route path="login">
        <Login />
      </Route>
      <Route path="/reader/:bookId/:chapterId">
        {(params) => (
          <Reader
            bookId={params.bookId}
            chapterId={params.chapterId}
          />
        )}
      </Route>
      <Route>
        <Home />
      </Route>
    </Switch>
  );
}
