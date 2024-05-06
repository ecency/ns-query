export namespace MessagesManagement {
  export class MessagesTagsBuilder {
    public static shared = new MessagesTagsBuilder();

    private tags = new Map<string, string[]>();

    public withRoot(root: string, relay: string) {
      return this.withTag("e", [root, relay, "root"]);
    }

    public withForwardedFrom(forwardedFrom: string | undefined) {
      return this.withTagSafe("fwd", [forwardedFrom]);
    }

    public withReferenceTo(parentMessageId: string | undefined) {
      return this.withTagSafe("pm", [parentMessageId]);
    }

    public withDestination(destination: string) {
      return this.withTag("p", [destination]);
    }

    public build() {
      return Array.from(this.tags.entries()).map(([tagName, value]) => [
        tagName,
        ...value,
      ]);
    }

    private withTagSafe(key: string, value: (string | undefined)[]) {
      const isPresent = value.filter((v) => !!v).length > 0;
      if (isPresent) {
        return this.withTag(key, value as string[]);
      }
      return this;
    }

    private withTag(key: string, value: string[]): this {
      this.tags.set(key, value);
      return this;
    }
  }
}
