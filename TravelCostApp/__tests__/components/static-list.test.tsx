import * as React from "react";
import { Text } from "react-native";
import { render, screen } from "@testing-library/react-native";

import StaticList from "../../components/UI/StaticList";

describe("StaticList", () => {
  it("renders all items from data", () => {
    render(
      <StaticList
        data={["alpha", "beta", "gamma"]}
        keyExtractor={(item) => item}
        renderItem={({ item }) => <Text>{item}</Text>}
      />
    );

    expect(screen.getByText("alpha")).toBeTruthy();
    expect(screen.getByText("beta")).toBeTruthy();
    expect(screen.getByText("gamma")).toBeTruthy();
  });

  it("renders header and footer components", () => {
    render(
      <StaticList
        data={["one"]}
        ListHeaderComponent={<Text>Header</Text>}
        ListFooterComponent={<Text>Footer</Text>}
        renderItem={({ item }) => <Text>{item}</Text>}
      />
    );

    expect(screen.getByText("Header")).toBeTruthy();
    expect(screen.getByText("Footer")).toBeTruthy();
    expect(screen.getByText("one")).toBeTruthy();
  });

  it("renders empty component when data is empty", () => {
    render(
      <StaticList
        data={[]}
        ListEmptyComponent={<Text>Nothing here</Text>}
        renderItem={({ item }) => <Text>{item}</Text>}
      />
    );

    expect(screen.getByText("Nothing here")).toBeTruthy();
  });

  it("supports function form for header, footer, and empty components", () => {
    render(
      <StaticList
        data={[]}
        ListHeaderComponent={() => <Text>FnHeader</Text>}
        ListFooterComponent={() => <Text>FnFooter</Text>}
        ListEmptyComponent={() => <Text>FnEmpty</Text>}
        renderItem={() => null}
      />
    );

    expect(screen.getByText("FnHeader")).toBeTruthy();
    expect(screen.getByText("FnFooter")).toBeTruthy();
    expect(screen.getByText("FnEmpty")).toBeTruthy();
  });

  it("forwards contentContainerStyle for grid layouts", () => {
    render(
      <StaticList
        data={["a", "b"]}
        contentContainerStyle={{ flexDirection: "row", flexWrap: "wrap" }}
        renderItem={({ item }) => <Text>{item}</Text>}
      />
    );

    expect(screen.getByTestId("static-list-content").props.style).toMatchObject({
      flexDirection: "row",
      flexWrap: "wrap",
    });
  });
});
