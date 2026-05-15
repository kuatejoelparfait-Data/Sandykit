export function generateDataFiles(projectName: string): Array<{ path: string; content: string }> {
  return [
    {
      path: 'requirements.txt',
      content: `pandas>=2.0.0\nnumpy>=1.24.0\nmatplotlib>=3.7.0\njupyterlab>=4.0.0\nscikit-learn>=1.3.0\n`,
    },
    {
      path: 'README.md',
      content: `# ${projectName}\n\n## Setup\n\n\`\`\`bash\npython -m venv .venv\nsource .venv/bin/activate  # Windows: .venv\\Scripts\\activate\npip install -r requirements.txt\n\`\`\`\n\n## Run\n\n\`\`\`bash\njupyter lab\n\`\`\`\n`,
    },
    {
      path: 'notebooks/01_exploration.ipynb',
      content: JSON.stringify({
        nbformat: 4,
        nbformat_minor: 5,
        metadata: { kernelspec: { display_name: 'Python 3', language: 'python', name: 'python3' } },
        cells: [
          {
            cell_type: 'markdown',
            metadata: {},
            source: [`# ${projectName} — Exploration`],
          },
          {
            cell_type: 'code',
            metadata: {},
            source: ['import pandas as pd\nimport numpy as np\nimport matplotlib.pyplot as plt\n\nprint("Setup OK")'],
            outputs: [],
            execution_count: null,
          },
        ],
      }, null, 2),
    },
    {
      path: 'src/__init__.py',
      content: '',
    },
    {
      path: 'src/pipeline.py',
      content: `"""Data pipeline for ${projectName}."""\n\ndef run_pipeline() -> None:\n    print("Pipeline running...")\n\n\nif __name__ == "__main__":\n    run_pipeline()\n`,
    },
  ];
}
