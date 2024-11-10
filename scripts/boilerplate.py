import click
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt, Confirm
from rich import print as rprint
import os
import json
from typing import List, Optional

class APICreator:
    def __init__(self):
        self.console = Console()

    def create(self):
        self.console.print(Panel.fit("🧙 Lapis Wizard", style="bold blue"))
        
        name = Prompt.ask("API name", default="", show_default=False).lower().strip()
        version = Prompt.ask("API version", default="1.0.0")
        description = Prompt.ask("API description")
        tags = Prompt.ask("Tags (comma-separated)", default="").strip()
        tags = [tag.strip() for tag in tags.split(",")] if tags else []
        
        method = Prompt.ask(
            "HTTP method",
            choices=["GET", "POST", "PUT", "DELETE", "PATCH"],
            default="GET"
        )
        
        cache_enabled = Confirm.ask("Enable caching?", default=False)
        cache_ttl = int(Prompt.ask("Cache TTL in seconds", default="60"))
        
        api_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "src", "apis", name)
        os.makedirs(api_dir, exist_ok=True)
        
        config = {
            "enabled": True,
            "metadata": {
                "name": name,
                "version": version,
                "description": description,
                "tags": tags
            }
        }
        
        with open(os.path.join(api_dir, "config.json"), "w") as f:
            json.dump(config, f, indent=2)
        
        index_content = f'''import {{ APIEndpointConfig, APIModule }} from "../../types/api";

interface {name.capitalize()}Params {{
    // TODO: Define your parameters here
}}

interface {name.capitalize()}Response {{
    // TODO: Define your response type here
}}

const config: APIEndpointConfig<{name.capitalize()}Params, {name.capitalize()}Response> = {{
    path: '/api/{name}',
    method: '{method}',
    cache: {{
        enabled: {str(cache_enabled).lower()},
        ttlSeconds: {cache_ttl}
    }},
    handler: async (params) => {{
        // TODO: Implement your API logic here
        throw new Error("Not implemented");
    }}
}};

const validate = async (params: unknown): Promise<boolean> => {{
    // TODO: Implement parameter validation
    return true;
}};

const {name}API: APIModule<{name.capitalize()}Params, {name.capitalize()}Response> = {{
    config,
    validate
}};

export = {name}API;
'''
        
        with open(os.path.join(api_dir, "index.ts"), "w") as f:
            f.write(index_content)
            
        self.console.print("\n")
        self.console.print(Panel(
            f"[green]✅ API '{name}' created successfully![/green]\n\n"
            f"📁 Location: {api_dir}\n\n"
            "[bold]Next steps:[/bold]\n"
            f"1. Define your parameter and response types in {name}/index.ts\n"
            f"2. Implement your API logic in the handler function\n"
            f"3. Add parameter validation in the validate function",
            title="Success",
            expand=False
        ))

@click.command()
def main():
    creator = APICreator()
    creator.create()

if __name__ == "__main__":
    main()
